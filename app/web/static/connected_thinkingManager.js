// connected_thinkingManager.js - 处理AI思考过程显示

export class ThinkingManager {
    constructor() {
        this.thinkingContainer = document.getElementById('thinking-timeline');
        this.recordCountElement = document.getElementById('record-count');
        this.autoScrollCheckbox = document.getElementById('auto-scroll');
        this.thinkingSteps = [];
        this.finalAnswer = null;
    }

    // 初始化思考管理器
    init() {
        // 初始化记录计数
        this.updateRecordCount();
    }

    // 添加思考步骤
    addThinkingStep(step) {
        this.thinkingSteps.push(step);

        // 如果是结论步骤或回答步骤，保存为最终答案
        if (step.type === 'conclusion' || step.type === 'completed' || step.type === 'answer') {
            this.finalAnswer = step;
        }

        // 创建并添加步骤元素
        const stepElement = this.createStepElement(step);
        this.thinkingContainer.appendChild(stepElement);

        // 更新记录计数
        this.updateRecordCount();

        // 如果启用了自动滚动，滚动到底部
        if (this.autoScrollCheckbox.checked) {
            this.scrollToBottom();
        }

        // 淡入效果
        setTimeout(() => {
            stepElement.style.opacity = 1;
        }, 10);

        // 如果是结论步骤或回答步骤，添加最终答案显示
        if (step.type === 'conclusion' || step.type === 'completed' || step.type === 'answer') {
            this.displayFinalAnswer(step);
        }
    }

    // 添加多个思考步骤
    addThinkingSteps(steps) {
        if (!Array.isArray(steps)) return;

        steps.forEach(step => {
            this.addThinkingStep(step);
        });
    }

    // 创建步骤元素
    createStepElement(step) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        itemDiv.style.opacity = 0; // 初始透明，用于淡入效果

        // 如果是完成步骤，添加completed类
        if (step.type === 'conclusion' || step.type === 'completed') {
            itemDiv.classList.add('completed');
        }

        // 创建标记点
        const markerDiv = document.createElement('div');
        markerDiv.className = 'timeline-marker';
        itemDiv.appendChild(markerDiv);

        // 创建内容容器
        const contentDiv = document.createElement('div');
        contentDiv.className = 'timeline-content';

        // 创建标题区域，包含徽章和标题
        const headerDiv = document.createElement('div');
        headerDiv.className = 'timeline-header';

        // 添加步骤类型徽章
        const badgeSpan = document.createElement('span');
        badgeSpan.className = `timeline-badge badge-${this.getBadgeType(step)}`;
        badgeSpan.textContent = this.getBadgeText(step);
        headerDiv.appendChild(badgeSpan);

        // 添加步骤标题
        const titleSpan = document.createElement('span');
        titleSpan.textContent = this.getStepHeader(step);
        headerDiv.appendChild(titleSpan);

        contentDiv.appendChild(headerDiv);

        // 如果是通信类型的步骤
        if (step.type === 'communication') {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'communication-header';
            headerDiv.innerHTML = `<span class="communication-direction">${step.message}</span> <span class="toggle-icon">▶</span>`;
            headerDiv.onclick = function() {
                const detailsElement = this.nextElementSibling;
                const toggleIcon = this.querySelector('.toggle-icon');

                if (detailsElement.style.display === 'none' || !detailsElement.style.display) {
                    detailsElement.style.display = 'block';
                    toggleIcon.textContent = '▼';
                    toggleIcon.style.transform = 'rotate(0deg)';
                } else {
                    detailsElement.style.display = 'none';
                    toggleIcon.textContent = '▶';
                    toggleIcon.style.transform = 'rotate(-90deg)';
                }
            };

            const detailsElement = document.createElement('div');
            detailsElement.className = 'timeline-details';
            detailsElement.style.display = 'none';

            if (step.details) {
                // 格式化JSON，如果是，使其更加可读
                try {
                    const parsedDetails = JSON.parse(step.details);
                    detailsElement.textContent = JSON.stringify(parsedDetails, null, 2);
                } catch (e) {
                    // 如果不是JSON，直接显示内容
                    detailsElement.textContent = step.details;
                }
            } else {
                detailsElement.textContent = '(无详细内容)';
            }

            contentDiv.appendChild(headerDiv);
            contentDiv.appendChild(detailsElement);
        }
        // 如果有详细内容，添加详情按钮和内容
        else if (step.details) {
            // 创建详情按钮
            const detailsButton = document.createElement('button');
            detailsButton.className = 'btn-details';
            detailsButton.textContent = '显示详情 ▼';
            contentDiv.appendChild(detailsButton);

            // 创建详情内容（初始隐藏）
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'timeline-details';
            detailsDiv.style.display = 'none';

            // 尝试格式化JSON
            try {
                const parsedDetails = JSON.parse(step.details);
                detailsDiv.textContent = JSON.stringify(parsedDetails, null, 2);
            } catch (e) {
                // 如果不是JSON，直接显示内容
                detailsDiv.textContent = step.details;
            }

            contentDiv.appendChild(detailsDiv);

            // 绑定详情按钮点击事件
            detailsButton.addEventListener('click', () => {
                if (detailsDiv.style.display === 'none') {
                    detailsDiv.style.display = 'block';
                    detailsButton.textContent = '隐藏详情 ▲';
                } else {
                    detailsDiv.style.display = 'none';
                    detailsButton.textContent = '显示详情 ▼';
                }
            });
        }

        // 如果是文件生成步骤，添加文件列表
        if (step.files && step.files.length > 0) {
            const fileListDiv = document.createElement('div');
            fileListDiv.className = 'file-list';

            // 更好的文件列表样式
            const fileHeader = document.createElement('div');
            fileHeader.className = 'file-list-header';
            fileHeader.textContent = '生成的文件:';
            fileListDiv.appendChild(fileHeader);

            const fileUl = document.createElement('ul');
            step.files.forEach(file => {
                const fileLi = document.createElement('li');
                fileLi.textContent = file;
                fileUl.appendChild(fileLi);
            });
            fileListDiv.appendChild(fileUl);

            contentDiv.appendChild(fileListDiv);
        }

        // 添加时间戳，如果存在
        if (step.timestamp) {
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'timeline-timestamp';
            const date = new Date(step.timestamp * 1000);
            timestampDiv.textContent = date.toLocaleTimeString();
            contentDiv.appendChild(timestampDiv);
        }

        itemDiv.appendChild(contentDiv);
        return itemDiv;
    }

    // 显示最终答案
    displayFinalAnswer(step) {
        // 检查是否已经有最终答案元素
        let finalAnswerSection = document.getElementById('final-answer-section');
        if (!finalAnswerSection) {
            // 创建最终答案区域
            finalAnswerSection = document.createElement('div');
            finalAnswerSection.id = 'final-answer-section';
            finalAnswerSection.className = 'final-answer-section';

            // 创建标题
            const headerDiv = document.createElement('div');
            headerDiv.className = 'section-header';
            headerDiv.innerHTML = `
                <h3>最终回答</h3>
                <div class="section-controls">
                    <button id="hide-final-answer" class="btn-hide">隐藏</button>
                </div>
            `;
            finalAnswerSection.appendChild(headerDiv);

            // 创建内容区域
            const contentDiv = document.createElement('div');
            contentDiv.id = 'final-answer-content';
            contentDiv.className = 'final-answer-content';
            finalAnswerSection.appendChild(contentDiv);

            // 添加到容器中，在thinking-timeline之后
            const thinkingSection = document.querySelector('.thinking-section');
            if (thinkingSection) {
                thinkingSection.appendChild(finalAnswerSection);

                // 绑定隐藏按钮事件
                document.getElementById('hide-final-answer').addEventListener('click', () => {
                    finalAnswerSection.style.display = 'none';
                });
            }
        }

        // 更新最终答案内容
        const contentDiv = document.getElementById('final-answer-content');
        if (contentDiv) {
            // 为结论/完成步骤创建特殊样式的内容
            contentDiv.innerHTML = '';

            // 添加最终答案标题 - 根据步骤类型使用不同的标题
            const answerTitle = document.createElement('div');
            answerTitle.className = 'answer-title';

            if (step.type === 'answer') {
                answerTitle.textContent = '最终回答:';
            } else {
                answerTitle.textContent = '根据以上思考步骤，我的回答是:';
            }

            contentDiv.appendChild(answerTitle);

            // 添加最终答案内容
            const answerContent = document.createElement('div');
            answerContent.className = 'answer-content';

            // 如果有result字段，优先使用result作为最终答案
            if (step.result) {
                answerContent.textContent = step.result;
            } else if (step.details) {
                answerContent.textContent = step.details;
            } else {
                answerContent.textContent = step.message || '已完成任务处理';
            }

            contentDiv.appendChild(answerContent);

            // 显示最终答案区域
            finalAnswerSection.style.display = 'block';

            // 滚动到最终答案
            finalAnswerSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // 获取步骤标题
    getStepHeader(step) {
        if (step.message) {
            return step.message;
        }

        switch (step.type) {
            case 'thinking':
                return step.content || '思考过程';
            case 'tool':
                return `使用工具: ${step.tool || ''}`;
            case 'file':
                return `在工作区 ${step.workspace || ''} 中生成了 ${step.files ? step.files.length : 0} 个文件:`;
            case 'conclusion':
            case 'completed':
                return `任务处理完成! 已在工作区 ${step.workspace || ''} 中生成结果。`;
            case 'answer':
                return '根据以上分析，最终回答如下:';
            case 'error':
                return `发生错误: ${step.error || ''}`;
            case 'system':
                return step.content || '系统消息';
            case 'system_log':
                return step.message || '系统日志';
            case 'progress':
                return `执行步骤 ${step.current}/${step.total}`;
            case 'communication':
                return step.message || '通信';
            default:
                return step.content ? step.content.substring(0, 50) + (step.content.length > 50 ? '...' : '') : '思考步骤';
        }
    }

    // 获取步骤类型对应的徽章类型
    getBadgeType(step) {
        switch (step.type) {
            case 'thinking':
                return 'thinking';
            case 'tool':
                return 'tool';
            case 'conclusion':
            case 'completed':
                return 'completed';
            case 'answer':
                return 'answer';
            case 'error':
                return 'error';
            case 'system':
            case 'system_log':
                return 'system';
            case 'communication':
                return 'communication';
            default:
                return 'thinking';
        }
    }

    // 获取徽章显示文本
    getBadgeText(step) {
        switch (step.type) {
            case 'thinking':
                return '思考';
            case 'tool':
                return '工具';
            case 'conclusion':
            case 'completed':
                return '完成';
            case 'answer':
                return '回答';
            case 'error':
                return '错误';
            case 'system':
            case 'system_log':
                return '系统';
            case 'communication':
                return '通信';
            default:
                return '思考';
        }
    }

    // 更新记录计数
    updateRecordCount() {
        if (this.recordCountElement) {
            this.recordCountElement.textContent = `${this.thinkingSteps.length} 条记录`;
        }
    }

    // 清除所有思考记录
    clearThinking() {
        this.thinkingSteps = [];
        this.thinkingContainer.innerHTML = '';
        this.updateRecordCount();

        // 清除最终答案
        this.finalAnswer = null;
        const finalAnswerSection = document.getElementById('final-answer-section');
        if (finalAnswerSection) {
            finalAnswerSection.style.display = 'none';
        }
    }

    // 滚动到底部
    scrollToBottom() {
        this.thinkingContainer.scrollTop = this.thinkingContainer.scrollHeight;
    }
}
