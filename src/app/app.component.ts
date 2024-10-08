import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import { timer } from 'rxjs';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'code-editor-fe';
  private socket: any;
  code: string = '';  // This will hold the code in the editor
  roomName: string = '';  // Holds the room name
  roomJoined: boolean = false;  // Tracks if the room has been joined
  showConfirmDialog: boolean = false;  // Track dialog visibility
  userMessage: string = '';
  private pingInterval = 13 * 60 * 1000; // 13 minutes in milliseconds
  
  ngOnInit(): void {
    // Connect to the Socket.IO server
    this.socket = io('https://code-editor-be-ppww.onrender.com');
    this.startPeriodicPing();
    // Listen for real-time code changes
    this.socket.on('codeChange', (codeUpdate: string) => {
      this.code = codeUpdate;  // Update the code in the editor
    });

    // Listen for room join confirmation
    this.socket.on('joinedRoom', (room: {room:string,updatedCode:string}) => {
      const roomData:any = room
      this.roomJoined = true;  // Set the flag to true to show the editor
      if(roomData.updatedCode){
        this.code = roomData.updatedCode
      }
    });

    this.socket.on('userDisconnected', (message: string) => {
      this.userMessage = message  // Handle user disconnection message
      setTimeout(() => {
        this.userMessage = '';
      }, 5000);
    });
  }

  // Emit code changes when the user types
  onCodeChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.code = target.value;
    if (this.roomName) {
      this.socket.emit('codeChange', { room: this.roomName, codeUpdate: this.code });
    }
  }

  // Handle joining a room
  joinRoom() {
    if (this.roomName) {
      this.socket.emit('joinRoom', this.roomName);
    }
  }

  // Download the code as a file
  downloadCode() {
    const blob = new Blob([this.code], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.roomName ? `${this.roomName}_code.txt` : 'code.txt';
    anchor.click();
    window.URL.revokeObjectURL(url);  // Free up memory
  }

  openConfirmDialog() {
    this.showConfirmDialog = true;
  }

  confirmLeave() {
    this.showConfirmDialog = false;
    this.socket.emit('leaveRoom', this.roomName);
    this.roomJoined = false;
    this.roomName = '';
    this.code = '';
  }

  cancelLeave() {
    this.showConfirmDialog = false;
  }

  private startPeriodicPing(): void {
    if (this.socket) {
      setInterval(()=>{
        this.pingBackend();
      }, this.pingInterval)
    }
  }

  private pingBackend(): void {
    if (this.socket) {
      this.socket.emit('ping'); // Emit a 'ping' event to the server
      console.log('Ping sent to backend');
    }else{
      this.socket = io('https://code-editor-be-ppww.onrender.com');
    }
  }
}
