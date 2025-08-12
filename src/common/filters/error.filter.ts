import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { ErrorModuleService } from "src/common/logs/error_module/error_module.service";
import ApiResponse from "../helpers/api-response";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

    constructor(
        private readonly errorLogService: ErrorModuleService
    ) { }

    async catch(exception: unknown, host: ArgumentsHost) {

        const ctx = host.switchToHttp();
        const request = ctx.getRequest<any>();
        const response = ctx.getResponse<Response>();

        const user = request?.user ;

        const status: number = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof HttpException
            ? exception.getResponse()
            : exception instanceof Error
                ? exception.message
                : 'Internal Server Error';

        const stack = exception instanceof Error ? exception.stack : null;

        if (status >= 500 && status !== 404) {
            await this.errorLogService.logError({
                statusCode: status,
                message: message as string,
                stack: stack as string,
                path: request.url,
                method: request.method,
                userId : user?._id
            })
        }

        response
            .status(status)
            .json(
                new ApiResponse(
                    false,
                    message as string,
                    status
                )
            );

    }

}