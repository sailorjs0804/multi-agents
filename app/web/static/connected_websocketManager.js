// connected_websocketManager.js - 管理WebSocket连接

export class WebSocketManager {
    constructor(onMessageCallback = null) {
        this.socket = null;
        this.sessionId = null;
        this.onMessageCallback = onMessageCallback;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.doNotReconnect = false;
    }

    connect(sessionId) {
        if (!sessionId) {
            console.error('无法连接WebSocket：缺少会话ID');
            return;
        }

        // 存储会话ID
        this.sessionId = sessionId;

        // 重置重连标志
        this.doNotReconnect = false;

        // 构建WebSocket URL
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/${sessionId}`;

        // 创建连接
        this.socket = new WebSocket(wsUrl);

        // 设置连接事件处理
        this.socket.onopen = (event) => {
        console.log('WebSocket连接已建立');
        this.reconnectAttempts = 0;
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket连接已关闭');

            // 检查是否设置了不要重连的标志
            if (this.doNotReconnect) {
                console.log('收到不要重连的指示，不会尝试重连');
                return;
            }

            // 尝试重连
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                setTimeout(() => this.connect(this.sessionId), this.reconnectDelay);
                // 每次重连增加延迟
                this.reconnectDelay *= 1.5;
            } else {
                console.error('已达到最大重连次数，放弃重连');
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket发生错误:', error);
        };

        this.socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

                // 检查是否收到不要重连的标志
                if (data.do_not_reconnect) {
                    console.log('收到服务器指示不要重连');
                    this.doNotReconnect = true;
                }

                // 执行消息回调
                if (this.onMessageCallback) {
                    this.onMessageCallback(data);
            }
        } catch (error) {
                console.error('WebSocket消息处理错误:', error);
        }
        };
    }

    disconnect() {
        if (this.socket) {
            // 设置不要重连的标志，防止重连
            this.doNotReconnect = true;

            // 检查连接状态并关闭
            if (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING) {
                console.log('主动关闭WebSocket连接');
                this.socket.close();
            }

            // 清空socket引用
            this.socket = null;
            console.log('WebSocket连接已断开');
        }
    }

    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket未连接，无法发送消息');
        }
    }
}
