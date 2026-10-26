import { Global, Module } from '@nestjs/common';
import { EmailService } from '../services/EmailService';
import { EmailController } from '../controllers/EmailController';
import { AccountEmailController } from '../controllers/AccountEmailController';
import { AccountEmailService } from '../services/AccountEmailService';
import { AccountProvisioningService } from '../services/AccountProvisioningService';
import { DomainEmailService } from '../services/DomainEmailService';

@Global()
@Module({
	providers: [EmailService, AccountEmailService, AccountProvisioningService, DomainEmailService],
	controllers: [EmailController, AccountEmailController],
	exports: [EmailService, AccountEmailService, DomainEmailService],
})
export class EmailModule {}