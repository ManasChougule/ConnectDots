

class ChatEngine {

    constructor(chatBoxId, userEmail,toUser) {
        const {hostname} = window.location;
        // const hostname = '13.204.64.57';
        const port = 5000;
        this.chatBox = $(`#${chatBoxId}`),
        this.userEmail = userEmail,
        this.to_user=toUser,
        this.socket = io.connect(`http://${hostname}:${port}`, { // http://43.205.209.122:5000
            transports: ['polling'] ,
        });
        console.info(`Websoket listing on http://${hostname}:${port}`);

        if (this.userEmail) {
            this.fetchPreviousMessages();
            this.connectionHandler();
        }   
    }         

    async fetchPreviousMessages() {
        
        try {
            const response = await fetch(`/chat/getPreviousMessages/${this.to_user}/`); 
            const data = await response.json();
            
            if (data.messages) {
                data.messages.forEach((message) => {
                    
                    this.displayMessage(message);
                });
                this.scrollChatToBottom();        
            }
        } catch (error) {   
            console.error('Error fetching previous messages:', error);
        }
    }

    scrollChatToBottom() {
        
        var chatMessagesList = document.getElementById("chat-messages-list");
        if (chatMessagesList) {
            chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
        }
    }
    
    splitMessage(message, lineLength) {
        const lines = [];
        const words = message.split(' ');
    
        let currentLine = '';
    
        for (const word of words) {
            if (currentLine.length + word.length <= lineLength) {
                currentLine += word + ' ';
            } else {
                if(word.length<=lineLength){
                    lines.push(currentLine.trim());
                    currentLine = word + ' ';
                }else{
                        
                        let startIndex = 0;
                        while (startIndex < word.length) {
                            lines.push(word.substring(startIndex, startIndex + lineLength)+'-');
                            startIndex += lineLength;
                        }
                        let w=lines.pop();
                        w=w.substring(0,w.length-1);
                        
                        currentLine =  w + ' ';
                }

            }
        }

        if (currentLine) {
            lines.push(currentLine.trim()); 
        }
    
        return lines;
    }


    
    displayMessage(data) {
        const isSelf = data.user_email === this.userEmail;
        const messageText = data.message;
        const lines = this.splitMessage(messageText, 10);  // Your custom line splitter

        // Create message container <li> with Bootstrap classes
        const messageListItem = $('<li>').addClass('d-flex flex-column mb-4') // column
            .addClass(isSelf ? 'justify-content-end' : 'justify-content-start');

        // Message bubble
        const messageBubble = $('<div>')
            .addClass('p-2 ms-3') // p-1 ms-2
            .css({
                borderRadius: '15px',
                backgroundColor: isSelf ? '#a0dcff' : '#ffa0a0'
            });

        // Add each line inside a <p>
        lines.forEach(line => {
            const linePara = $('<p>').addClass('small mb-0').text(line);
            messageBubble.append(linePara);
        });

        messageListItem.append(messageBubble);

        // ⬇ Append sender’s email in its own line (only for other users)
        if (!isSelf) {
        const emailDiv = $('<div>')
            .addClass('chat-sender-email')  
            .text(data.user_email);

        messageListItem.append(emailDiv);   
        }

        $('#chat-messages-list').append(messageListItem);

        this.scrollChatToBottom();
    }


    connectionHandler() {
        let self = this;
        this.socket.on('connect', function() {
            console.log('connection established using sockets...!' , self.userEmail && self.to_user==null , self.to_user==null , self.userEmail,self.to_user);
            if (self.userEmail && self.to_user==null) {  
                
                self.socket.emit('join_room', {
                    user_email: self.userEmail,
                    chatroom: 'EternalEchoes',
                    to_user:null
                });
            }else{
                
                self.socket.emit('join_personal_room', {
                    user_email: self.userEmail,
                    chatroom: 'ConnectDots_Personal',
                    to_user:self.to_user
                });
            }

            self.socket.on('user_joined', function(data) {
                
            });
            self.socket.on('user_joined2', function(data) {
                
            });
        });

        
        $('#send-message').click(function() {
            let msg = $('#InputMessage').val();
            
            if (msg !== '' && msg.length<=100) {
                if (self.to_user == null) { 
                    self.socket.emit('send_message', {
                        message: msg,
                        user_email: self.userEmail,
                        chatroom: 'EternalEchoes',
                        to_user:null
                    });
                } else { 
                    self.socket.emit('send_message2', {
                        message: msg,
                        user_email: self.userEmail,
                        chatroom: 'ConnectDots_Personal',
                        to_user: self.to_user
                    });
                }

                
                $('#InputMessage').val('');

            } else {
                if(msg==''){
                    displayFlashMessage("Message is empty!!!", true);
                }else{
                    displayFlashMessage('Message length should be less than 100', true);
                }
            }

        });

        $('#InputMessage').keydown(function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                $('#send-message').click(); 
            }
        });

        this.socket.on('receive_message', function(data) {
            
            self.displayMessage(data);  
        });

        this.socket.on('receive_message2', function(data) {
  
            if(data.user_email==self.to_user  || data.user_email==self.userEmail){
                self.displayMessage(data);
            }
        });  
       
    }
}

function displayFlashMessage(message, isError) {
    new Noty({
        theme: 'relax',
        text: `${message}`,
        type: 'error',
        layout: 'topRight',
        timeout: 1500
    }).show();
    $('#InputMessage').val('');
}


