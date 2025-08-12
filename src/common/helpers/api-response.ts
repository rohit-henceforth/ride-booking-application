export default class ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    statusCode: number;

    constructor(
        success: boolean,
        message: string,
        statusCode: number,
        data?: T
    ) {
        this.success = success ;
        this.message = message ;
        this.data = data ;
        this.statusCode = statusCode ;
     }

}