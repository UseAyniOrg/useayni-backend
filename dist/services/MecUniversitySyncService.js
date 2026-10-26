"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MecUniversitySyncService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const http_1 = require("http");
const https_1 = require("https");
const url_1 = require("url");
const util_1 = require("util");
const zlib_1 = require("zlib");
const db_1 = require("../db");
const MEC_UNIVERSITIES_CSV_URL = 'https://dadosabertos.mec.gov.br/images/conteudo/Ind-ensino-superior/2022/PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv';
const STATE_NAMES = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapa',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceara',
    DF: 'Distrito Federal',
    ES: 'Espirito Santo',
    GO: 'Goias',
    MA: 'Maranhao',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Para',
    PB: 'Paraiba',
    PR: 'Parana',
    PE: 'Pernambuco',
    PI: 'Piaui',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondonia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'Sao Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins',
};
let MecUniversitySyncService = class MecUniversitySyncService {
    async syncFromMecCsv(options = {}) {
        const sourceUrl = options.sourceUrl || MEC_UNIVERSITIES_CSV_URL;
        const csv = options.sourceFile
            ? await this.readSourceFile(options.sourceFile)
            : await this.downloadText(sourceUrl);
        const records = this.parseCsv(csv);
        const rows = options.limit ? records.slice(0, options.limit) : records;
        const queryRunner = db_1.AppDataBase.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const seenStates = new Set();
        const seenCities = new Set();
        const seenUniversities = new Set();
        let processedRows = 0;
        let skippedRows = 0;
        try {
            for (const record of rows) {
                const emecCode = this.onlyDigits(this.pick(record, [
                    'codigo_ies',
                    'codigo_da_ies',
                    'codigo_da_instituicao_de_educacao_superior_ies',
                    'cod_ies',
                    'co_ies',
                ]));
                const name = this.pick(record, [
                    'nome_ies',
                    'nome_da_ies',
                    'nome_da_instituicao_de_educacao_superior_ies',
                    'instituicao_de_educacao_superior',
                    'no_ies',
                ]);
                const uf = this.pick(record, ['uf', 'sigla_uf', 'sg_uf_ies']).toUpperCase();
                const cityName = this.pick(record, [
                    'municipio',
                    'nome_municipio',
                    'nome_do_municipio',
                    'no_municipio',
                    'no_municipio_ies',
                ]);
                const cityIbgeCode = this.onlyDigits(this.pick(record, [
                    'codigo_municipio_ibge',
                    'codigo_do_municipio_ibge',
                    'codigo_municipio',
                    'cod_municipio',
                    'co_municipio',
                    'co_municipio_ies',
                ]));
                const status = this.pick(record, ['situacao_ies', 'situacao', 'status']);
                if (!name || !uf || !cityName || !cityIbgeCode) {
                    skippedRows += 1;
                    continue;
                }
                if (!options.includeInactive && this.isInactive(status)) {
                    skippedRows += 1;
                    continue;
                }
                const stateId = await this.upsertState(queryRunner, uf);
                seenStates.add(uf);
                const cityId = await this.upsertCity(queryRunner, cityName, cityIbgeCode, stateId);
                seenCities.add(cityIbgeCode);
                await this.upsertUniversity(queryRunner, {
                    emecCode,
                    name,
                    acronym: this.pick(record, ['sigla', 'sigla_ies', 'sg_ies']) || null,
                    category: this.pick(record, [
                        'categoria_ies',
                        'categoria_da_ies',
                        'categoria_administrativa',
                        'tp_categoria_administrativa',
                    ]) || null,
                    organizationType: this.pick(record, [
                        'organizacao_academica',
                        'organizacao_da_ies',
                        'organizacao',
                        'tp_organizacao_academica',
                    ]) || null,
                    status: status || null,
                    cityId,
                });
                seenUniversities.add(emecCode || this.normalizeKey(`${name}-${cityIbgeCode}`));
                processedRows += 1;
            }
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return {
            sourceUrl,
            totalRows: records.length,
            processedRows,
            skippedRows,
            statesUpserted: seenStates.size,
            citiesUpserted: seenCities.size,
            universitiesUpserted: seenUniversities.size,
        };
    }
    async upsertState(queryRunner, uf) {
        const result = await queryRunner.query(`INSERT INTO states (name, uf)
       VALUES ($1, $2)
       ON CONFLICT (uf) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`, [STATE_NAMES[uf] || uf, uf]);
        return result[0].id;
    }
    async upsertCity(queryRunner, name, ibgeCode, stateId) {
        const result = await queryRunner.query(`INSERT INTO cities (name, ibge_code, state_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (ibge_code) WHERE ibge_code IS NOT NULL
       DO UPDATE SET name = EXCLUDED.name, state_id = EXCLUDED.state_id
       RETURNING id`, [name, ibgeCode, stateId]);
        return result[0].id;
    }
    async upsertUniversity(queryRunner, data) {
        if (data.emecCode) {
            const result = await queryRunner.query(`INSERT INTO universities (
          name, acronym, emec_code, source, category, organization_type, status, city_id
        )
        VALUES ($1, $2, $3, 'MEC_EMEC_CSV', $4, $5, $6, $7)
        ON CONFLICT (emec_code) WHERE emec_code IS NOT NULL
        DO UPDATE SET
          name = EXCLUDED.name,
          acronym = EXCLUDED.acronym,
          source = EXCLUDED.source,
          category = EXCLUDED.category,
          organization_type = EXCLUDED.organization_type,
          status = EXCLUDED.status,
          city_id = EXCLUDED.city_id
        RETURNING id`, [
                data.name,
                data.acronym,
                data.emecCode,
                data.category,
                data.organizationType,
                data.status,
                data.cityId,
            ]);
            return result[0].id;
        }
        const result = await queryRunner.query(`INSERT INTO universities (
        name, acronym, source, category, organization_type, status, city_id
      )
      VALUES ($1, $2, 'MEC_EMEC_CSV', $3, $4, $5, $6)
      RETURNING id`, [
            data.name,
            data.acronym,
            data.category,
            data.organizationType,
            data.status,
            data.cityId,
        ]);
        return result[0].id;
    }
    async downloadText(url, redirectCount = 0) {
        if (redirectCount > 5) {
            throw new Error('Limite de redirecionamentos excedido ao baixar CSV do MEC');
        }
        const parsedUrl = new url_1.URL(url);
        const client = parsedUrl.protocol === 'https:' ? https_1.request : http_1.request;
        return new Promise((resolve, reject) => {
            const req = client(parsedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                    Accept: 'text/csv,application/csv,text/plain,application/octet-stream,*/*',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    Referer: 'https://dadosabertos.mec.gov.br/indicadores-sobre-ensino-superior/item/181-instituicoes-de-educacao-superior-do-brasil',
                    Connection: 'keep-alive',
                },
            }, (res) => {
                const statusCode = res.statusCode || 0;
                const location = res.headers.location;
                if (statusCode >= 300 && statusCode < 400 && location) {
                    res.resume();
                    const nextUrl = new url_1.URL(location, parsedUrl).toString();
                    this.downloadText(nextUrl, redirectCount + 1).then(resolve).catch(reject);
                    return;
                }
                if (statusCode < 200 || statusCode >= 300) {
                    res.resume();
                    reject(new Error(`Falha ao baixar CSV do MEC. HTTP ${statusCode}. Se o portal estiver bloqueando download automatico, baixe o CSV e rode com --source-file=caminho\\arquivo.csv`));
                    return;
                }
                const chunks = [];
                res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                res.on('end', () => resolve(this.decodeBuffer(Buffer.concat(chunks))));
            });
            req.on('error', reject);
            req.end();
        });
    }
    decodeBuffer(buffer) {
        const utf8 = new util_1.TextDecoder('utf-8').decode(buffer);
        if (!utf8.includes('\uFFFD'))
            return utf8;
        return new util_1.TextDecoder('latin1').decode(buffer);
    }
    async readSourceFile(sourceFile) {
        const fileBuffer = await (0, promises_1.readFile)(sourceFile);
        if (!sourceFile.toLowerCase().endsWith('.zip')) {
            return this.decodeBuffer(fileBuffer);
        }
        const csvBuffer = this.extractCsvFromZip(fileBuffer, [
            'MICRODADOS_ED_SUP_IES',
            'PDA_Lista_Instituicoes',
            'Instituicoes_Ensino_Superior',
        ]);
        return this.decodeBuffer(csvBuffer);
    }
    extractCsvFromZip(zipBuffer, preferredNames) {
        const eocdSignature = 0x06054b50;
        let eocdOffset = -1;
        for (let offset = zipBuffer.length - 22; offset >= 0; offset -= 1) {
            if (zipBuffer.readUInt32LE(offset) === eocdSignature) {
                eocdOffset = offset;
                break;
            }
        }
        if (eocdOffset < 0) {
            throw new Error('Arquivo ZIP invalido: diretorio central nao encontrado');
        }
        const centralDirectorySize = zipBuffer.readUInt32LE(eocdOffset + 12);
        const centralDirectoryOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
        const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
        const entries = [];
        let offset = centralDirectoryOffset;
        while (offset < centralDirectoryEnd) {
            if (zipBuffer.readUInt32LE(offset) !== 0x02014b50)
                break;
            const compressionMethod = zipBuffer.readUInt16LE(offset + 10);
            const compressedSize = zipBuffer.readUInt32LE(offset + 20);
            const uncompressedSize = zipBuffer.readUInt32LE(offset + 24);
            const fileNameLength = zipBuffer.readUInt16LE(offset + 28);
            const extraFieldLength = zipBuffer.readUInt16LE(offset + 30);
            const fileCommentLength = zipBuffer.readUInt16LE(offset + 32);
            const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);
            const fileName = zipBuffer
                .subarray(offset + 46, offset + 46 + fileNameLength)
                .toString('utf8');
            entries.push({
                fileName,
                compressionMethod,
                compressedSize,
                uncompressedSize,
                localHeaderOffset,
            });
            offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
        }
        const csvEntry = entries.find((entry) => entry.fileName.toLowerCase().endsWith('.csv') &&
            preferredNames.some((name) => entry.fileName.includes(name))) || entries.find((entry) => entry.fileName.toLowerCase().endsWith('.csv'));
        if (!csvEntry) {
            throw new Error('Nenhum CSV encontrado dentro do ZIP informado');
        }
        const localOffset = csvEntry.localHeaderOffset;
        if (zipBuffer.readUInt32LE(localOffset) !== 0x04034b50) {
            throw new Error(`Cabecalho local invalido para ${csvEntry.fileName}`);
        }
        const localFileNameLength = zipBuffer.readUInt16LE(localOffset + 26);
        const localExtraFieldLength = zipBuffer.readUInt16LE(localOffset + 28);
        const dataOffset = localOffset + 30 + localFileNameLength + localExtraFieldLength;
        const compressedData = zipBuffer.subarray(dataOffset, dataOffset + csvEntry.compressedSize);
        if (csvEntry.compressionMethod === 0)
            return compressedData;
        if (csvEntry.compressionMethod === 8) {
            const inflated = (0, zlib_1.inflateRawSync)(compressedData);
            if (csvEntry.uncompressedSize && inflated.length !== csvEntry.uncompressedSize) {
                throw new Error(`Falha ao validar tamanho extraido de ${csvEntry.fileName}`);
            }
            return inflated;
        }
        throw new Error(`Metodo de compressao ZIP nao suportado (${csvEntry.compressionMethod}) em ${csvEntry.fileName}`);
    }
    parseCsv(csv) {
        const normalizedCsv = csv.replace(/^\uFEFF/, '');
        const delimiter = this.detectDelimiter(normalizedCsv);
        const rows = this.parseRows(normalizedCsv, delimiter).filter((row) => row.some((value) => value.trim()));
        if (rows.length === 0)
            return [];
        const headers = rows[0].map((header) => this.normalizeHeader(header));
        return rows.slice(1).map((row) => {
            const record = {};
            headers.forEach((header, index) => {
                record[header] = (row[index] || '').trim();
            });
            return record;
        });
    }
    detectDelimiter(csv) {
        const firstLine = csv.split(/\r?\n/, 1)[0] || '';
        const semicolons = (firstLine.match(/;/g) || []).length;
        const commas = (firstLine.match(/,/g) || []).length;
        return semicolons >= commas ? ';' : ',';
    }
    parseRows(csv, delimiter) {
        const rows = [];
        let currentRow = [];
        let currentValue = '';
        let insideQuotes = false;
        for (let index = 0; index < csv.length; index += 1) {
            const char = csv[index];
            const nextChar = csv[index + 1];
            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    currentValue += '"';
                    index += 1;
                }
                else {
                    insideQuotes = !insideQuotes;
                }
                continue;
            }
            if (char === delimiter && !insideQuotes) {
                currentRow.push(currentValue);
                currentValue = '';
                continue;
            }
            if ((char === '\n' || char === '\r') && !insideQuotes) {
                if (char === '\r' && nextChar === '\n')
                    index += 1;
                currentRow.push(currentValue);
                rows.push(currentRow);
                currentRow = [];
                currentValue = '';
                continue;
            }
            currentValue += char;
        }
        if (currentValue || currentRow.length > 0) {
            currentRow.push(currentValue);
            rows.push(currentRow);
        }
        return rows;
    }
    pick(record, keys) {
        for (const key of keys) {
            const value = record[key];
            if (value && value.trim())
                return value.trim();
        }
        return '';
    }
    normalizeHeader(value) {
        return this.normalizeKey(value)
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_');
    }
    normalizeKey(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_');
    }
    onlyDigits(value) {
        const digits = value.replace(/\D/g, '');
        return digits || null;
    }
    isInactive(status) {
        const normalized = this.normalizeKey(status);
        return ['inativa', 'inativo', 'extinta', 'extinto', 'descredenciada'].some((word) => normalized.includes(word));
    }
};
exports.MecUniversitySyncService = MecUniversitySyncService;
exports.MecUniversitySyncService = MecUniversitySyncService = __decorate([
    (0, common_1.Injectable)()
], MecUniversitySyncService);
