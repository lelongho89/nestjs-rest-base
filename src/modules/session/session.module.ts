import { Module } from '@nestjs/common';
import { SessionProvider } from './session.model';
import { SessionService } from './session.service';

@Module({
  providers: [SessionService, SessionProvider],
  exports: [SessionService],
})
export class SessionModule { }
