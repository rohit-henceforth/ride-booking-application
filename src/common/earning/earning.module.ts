import { forwardRef, Module } from "@nestjs/common";
import { EarningService } from "./earning.service";
import { CommonModule } from "../common.module";
import { DriverModule } from "src/modules/driver/driver.module";
import { EarningCron } from "./earning.cron";

@Module({
  imports: [
    CommonModule,
    forwardRef(() => DriverModule)
  ],
  providers: [EarningService, EarningCron],
  exports: [EarningService],
})
export class EarningModule {}
