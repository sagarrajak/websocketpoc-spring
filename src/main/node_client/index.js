const StompJs = require('@stomp/stompjs');
const readline = require('readline');
const WebSocket = require('ws');
const SockJS = require('sockjs-client');
const colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

let stompClient = null;
let username = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


async function connect() {
    try {
        username = await new Promise((resolve) => {
            rl.question('Enter your username: ', (name) => {
                resolve(name.trim());
            });
        });

        if (!username) {
            throw new Error('Username cannot be empty');
        }
        const socket = new SockJS('http://localhost:8080/ws?username=user&password=password');
        console.log('Connecting...');
        stompClient = new StompJs.Client({
            webSocketFactory: () => socket,
//            brokerURL: "",
            connectHeaders: {
                'X-username': 'user',
                'X-password': 'password',
                'login': 'user',
                'passcode': 'password',
            },
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        stompClient.onConnect = function(frame) {
            console.log('Connected: ' + frame);
            console.log('Connected to WebSocket server');

            // Subscribe to the Public Topic
            stompClient.subscribe('/topic/public', onMessageReceived);

            // Tell your username to the server
            stompClient.publish({
                destination: "/app/chat.addUser",
                body: JSON.stringify({sender: username, type: 'JOIN'})
            });

            startChat();
        };

        stompClient.onStompError = function(error) {
            console.error('Could not connect to WebSocket server. Please try again!');
            process.exit(1);
        };

        await stompClient.activate();
    } catch (error) {
        console.error('Error during connection:', error);
        process.exit(1);
    }
}

function startChat() {
    rl.on('line', (input) => {
        sendMessage(input);
    });
}

function sendMessage(messageContent) {
    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };
        stompClient.publish({
            destination: "/app/chat.sendMessage",
            body: JSON.stringify(chatMessage)
        });
    }
}

function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);

    if (message.type === 'JOIN') {
        console.log(`${message.sender} joined!`);
    } else if (message.type === 'LEAVE') {
        console.log(`${message.sender} left!`);
    } else {
        const senderColor = getAvatarColor(message.sender);
        console.log(`\x1b[38;2;${hexToRgb(senderColor)}m${message.sender}\x1b[0m: ${message.content}`);
    }
}

function getAvatarColor(messageSender) {
    let hash = 0;
    for (let i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r};${g};${b}`;
}

// Start the client
(async function() {
    try {
        await connect();
        console.log('Chat client started. Type your messages and press Enter to send.');
    } catch (error) {
        console.error('Failed to start chat client:', error);
        process.exit(1);
    }
})();