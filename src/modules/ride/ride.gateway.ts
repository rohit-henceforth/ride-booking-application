import { UseFilters } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsExceptionFilter } from 'src/common/filters/ws-error.filter';

@WebSocketGateway({ namespace: '/ride' })
@UseFilters(new WsExceptionFilter())
export class RideGateway {

  @WebSocketServer() private server: Server;
  private connectedUsers: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    this.connectedUsers.set(userId, client.id);

    console.log(
      `User ${userId} connected to ride gateway with socketId ${client.id}`,
    );
    
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;

    this.connectedUsers.delete(userId);

    console.log(
      `User ${userId} disconnected from ride gateway with socketId ${client.id}`,
    );
  }

  sendRideRequest(driverId: string, rideDetails: any) {

    const driverSocketId = this.connectedUsers.get(driverId);

    if (driverSocketId) {
      this.server.to(driverSocketId).emit('ride-request', rideDetails);
    }

  }

  sendRideAccepted(userId : string, rideDetails : any){

    const userSocketId = this.connectedUsers.get(userId);

    if(userSocketId){
      this.server.to(userSocketId).emit('ride-accepted',rideDetails);
    }

  }

  sendRideTerminated(userId : string, rideDetails : any){

    const userSocketId = this.connectedUsers.get(userId); 

    if(userSocketId){
      this.server.to(userSocketId).emit('ride-terminated',rideDetails);
    }

  }

  sendRideRequestFailed(userId : string, rideDetails : any){

    const userSocketId = this.connectedUsers.get(userId); 

    if(userSocketId){
      this.server.to(userSocketId).emit('ride-failed',{message : "Sorry current no driver is available in your area. Your refund has been initiated!", rideDetails});
    }

  }

  sendRideConfirmed(userId : string, rideDetails : any){

    const userSocketId = this.connectedUsers.get(userId); 

    if(userSocketId){
      this.server.to(userSocketId).emit('ride-confirmed',{message : "Your ride has been confirmed. Looking for your driver...", rideDetails});
    }

  }

  sendRadiusUpdate(userId : string, rideDetails : any){

    const userSocketId = this.connectedUsers.get(userId);

    if(userSocketId){
      this.server.to(userSocketId).emit('search-update',{message : `Looking for riders within ${rideDetails.sentToRadius} kms`, rideDetails});
    }

  }

  sendRideStarted(userId : string, rideDetails : any){

    const userSocketId = this.connectedUsers.get(userId);

    if(userSocketId){
      this.server.to(userSocketId).emit('ride-started',{message : `Your ride has been started!`, rideDetails});
    }

  }

  sendRideCancelled(userId : string, rideDetails : any){

    const userSocketId = this.connectedUsers.get(userId);

    if(userSocketId){
      this.server.to(userSocketId).emit('ride-cancelled',rideDetails);
    }

  }

  sendRideCompleted(userId : string, rideDetails : any){

    const userSocketId = this.connectedUsers.get(userId);

    if(userSocketId){
      this.server.to(userSocketId).emit('ride-completed',{message : "Your ride has been completed!",rideDetails});
    }

  }

}
