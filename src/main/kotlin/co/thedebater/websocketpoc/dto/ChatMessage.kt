package co.thedebater.websocketpoc.dto

enum class MessageType {
    CHAT, JOIN,LEAVE
}

data class ChatMessage(
    val content: String?,
    val sender: String,
    val type: MessageType
)
