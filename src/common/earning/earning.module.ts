import { Module } from "@nestjs/common";
import { EarningService } from "./earning.service";
import { CommonModule } from "../common.module";

@Module({
    imports: [
        CommonModule
    ],
    providers: [EarningService],
    exports: [EarningService]
})
export class EarningModule {}