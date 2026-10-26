import { Injectable } from '@nestjs/common';
import { AppDataBase } from "../db";
import { Token } from "../models/token";

@Injectable()
export class TokenRepository {
  private repository = AppDataBase.getRepository(Token);

  async findByToken(token: string) {
    return this.repository.findOne({ where: { token } });
  }

  async deleteByMemberId(memberId: string) {
    return this.repository.delete({ memberId });
  }

  async deleteByMemberIdAndType(memberId: string, type: "access" | "refresh") {
    return this.repository.delete({ memberId, type });
  }

  async deleteByAccountId(accountId: string) {
    return this.repository.delete({ account_id: accountId });
  }

  async deleteByAccountIdAndType(accountId: string, type: "access" | "refresh") {
    return this.repository.delete({ account_id: accountId, type });
  }

  async deleteByToken(token: string) {
    return this.repository.delete({ token });
  }

  async save(tokenData: Partial<Token>) {
    return this.repository.save(tokenData);
  }
}
