import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DriverService } from "src/modules/driver/driver.service";
import { EarningService } from "./earning.service";

@Injectable()
export class EarningCron {

    constructor(
        @Inject(forwardRef(() => DriverService)) private readonly driverService: DriverService,
        private readonly earningService: EarningService
    ){}
    

    @Cron('0 11 * * 0')
    async handleSundayPayouts() {
      
        const eligibleDrivers : any = await this.driverService.getPayoutEligibleDrivers();

        console.log(eligibleDrivers)

        for(const driver of eligibleDrivers){

            const earnings = await this.earningService.getDriverDueEarnings(driver?._id);

            console.log(earnings);

            if(earnings.length > 0){

                await this.driverService.handlePayout(driver, earnings);
            
            }

        }

    }

}