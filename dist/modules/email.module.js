"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const EmailService_1 = require("../services/EmailService");
const EmailController_1 = require("../controllers/EmailController");
const AccountEmailController_1 = require("../controllers/AccountEmailController");
const AccountEmailService_1 = require("../services/AccountEmailService");
const AccountProvisioningService_1 = require("../services/AccountProvisioningService");
const DomainEmailService_1 = require("../services/DomainEmailService");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [EmailService_1.EmailService, AccountEmailService_1.AccountEmailService, AccountProvisioningService_1.AccountProvisioningService, DomainEmailService_1.DomainEmailService],
        controllers: [EmailController_1.EmailController, AccountEmailController_1.AccountEmailController],
        exports: [EmailService_1.EmailService, AccountEmailService_1.AccountEmailService, DomainEmailService_1.DomainEmailService],
    })
], EmailModule);
