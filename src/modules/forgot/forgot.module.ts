import { Module } from '@nestjs/common';
import { ForgotProvider } from './forgot.model';
import { ForgotService } from './forgot.service';

@Module({
  providers: [ForgotProvider, ForgotService],
  exports: [ForgotService],
})
export class ForgotModule { }
