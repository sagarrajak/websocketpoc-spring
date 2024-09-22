package co.thedebater.websocketpoc.config

import co.thedebater.websocketpoc.dto.ChatMessage
import co.thedebater.websocketpoc.dto.MessageType
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.SimpMessageSendingOperations
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.stereotype.Component
import org.springframework.web.socket.messaging.SessionConnectedEvent
import org.springframework.web.socket.messaging.SessionDisconnectEvent

@Component
class WebSocketEventListener(
    private val messageTemplate: SimpMessageSendingOperations
) {

    @EventListener
    fun handleWebSocketListener(sessionDisconnectEvent: SessionDisconnectEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(sessionDisconnectEvent.message)
        val username = headerAccessor.sessionAttributes?.get("username") as? String;
        username?.let {
            val chatMessage = ChatMessage("$it disconnected", it, MessageType.LEAVE)
            messageTemplate.convertAndSend("/topic/public", chatMessage)
        }
    }

    @EventListener
    fun handWebSocketConnectListener(sessionConnectedEvent: SessionConnectedEvent) {
        val headerAccess = StompHeaderAccessor.wrap(sessionConnectedEvent.message)
        val username = headerAccess.sessionAttributes?.get("username") as? String
        username?.let {
            val chatMessage = ChatMessage("$it connected", it, MessageType.JOIN)
            messageTemplate.convertAndSend("/topic/public", chatMessage)
        }
    }
}