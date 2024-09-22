const StompJs = require('@stomp/stompjs');
const SockJS = require('sockjs-client');
const readline = require('readline');

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

function connect() {
    return new Promise((resolve) => {
        rl.question('Enter your username: ', (name) => {
            username = name.trim();
            if (username) {
                console.log('Connecting...');
                const socket = new SockJS('http://localhost:8080/ws');
                stompClient = StompJs.Stomp.over(socket);
                stompClient.connect({}, onConnected, onError);
            }
            resolve();
        });
    });
}

function onConnected() {
    console.log('Connected to WebSocket server');

    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    );

    startChat();
}

function onError(error) {
    console.error('Could not connect to WebSocket server. Please try again!');
    process.exit(1);
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
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
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
connect().then(() => {
    console.log('Chat client started. Type your messages and press Enter to send.');
});