import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class AppointmentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`WebSocket conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WebSocket desconectado: ${client.id}`);
  }

  emitCreated(appointment: any) {
    this.server.emit('appointment:created', appointment);
  }

  emitUpdated(appointment: any) {
    this.server.emit('appointment:updated', appointment);
  }

  emitCanceled(id: string) {
    this.server.emit('appointment:canceled', { id });
  }
}
