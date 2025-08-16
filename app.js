// AI Meeting Notes Summarizer - JavaScript Application Logic

class MeetingNotesSummarizer {
    constructor() {
        this.sampleData = {
            transcript: "John: Good morning everyone, thanks for joining today's quarterly review meeting. Sarah: Thanks John. I've prepared the Q3 sales report. We exceeded our targets by 15% this quarter, generating $2.3M in revenue. Mike: That's great news! The marketing campaigns we launched in July really paid off. The conversion rate increased by 22%. Sarah: Exactly. Our biggest wins were in the enterprise segment. We closed 3 major deals worth $500K each. John: Excellent work team. What about the challenges? Mike: We're seeing some supply chain delays affecting product delivery. It's adding about 2-3 weeks to our timelines. Sarah: Customer support tickets also increased by 40% due to the delivery delays. We need to address this quickly. John: Understood. Let's discuss action items. Mike, can you work with operations to resolve the supply chain issues? Mike: Absolutely. I'll have a plan by Friday. John: Sarah, please work with customer success to improve our communication about delays. Sarah: Will do. I'll draft a customer communication template by Wednesday. John: Great. Our next meeting is scheduled for next Tuesday at 2 PM. Thanks everyone!",
            instructions: [
                "Summarize in bullet points for executives",
                "Highlight only action items and deadlines",
                "Create a brief overview for stakeholders",
                "Focus on key decisions and next steps",
                "Extract metrics and performance data"
            ]
        };
        
        this.processingTimeout = null;
        this.maxProcessingTime = 8000; // 8 seconds max processing time
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFormValidation();
        this.updateEmailPreview();
    }

    bindEvents() {
        // Main action buttons
        document.getElementById('generate-btn').addEventListener('click', () => this.generateSummary());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
        document.getElementById('demo-btn').addEventListener('click', () => this.loadDemo());
        document.getElementById('regenerate-btn').addEventListener('click', () => this.regenerateSummary());
        document.getElementById('send-email-btn').addEventListener('click', () => this.sendEmail());

        // Suggestion chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', (e) => this.selectInstruction(e.target.dataset.instruction));
        });

        // Text change handlers
        document.getElementById('summary-output').addEventListener('input', () => {
            this.updateWordCount();
            this.updateEmailPreview();
        });

        document.getElementById('email-subject').addEventListener('input', () => this.updateEmailPreview());
        document.getElementById('email-recipients').addEventListener('input', () => this.validateEmails());

        // Real-time transcript validation
        document.getElementById('transcript-input').addEventListener('input', () => this.validateTranscript());
    }

    setupFormValidation() {
        // Initialize validation states
        this.validateTranscript();
        this.validateEmails();
    }

    validateTranscript() {
        const transcript = document.getElementById('transcript-input').value.trim();
        const feedback = document.getElementById('transcript-feedback');
        const input = document.getElementById('transcript-input');
        
        if (transcript.length === 0) {
            feedback.textContent = '';
            input.classList.remove('error', 'success');
            return false;
        } else if (transcript.length < 50) {
            feedback.textContent = 'Transcript is too short. Please provide more content for better summarization.';
            feedback.className = 'input-feedback error';
            input.classList.add('error');
            input.classList.remove('success');
            return false;
        } else {
            feedback.textContent = `Ready for processing (${transcript.length} characters)`;
            feedback.className = 'input-feedback success';
            input.classList.remove('error');
            input.classList.add('success');
            return true;
        }
    }

    validateEmails() {
        const emailInput = document.getElementById('email-recipients');
        const feedback = document.getElementById('email-feedback');
        const emails = emailInput.value.split(',').map(email => email.trim()).filter(email => email);
        
        if (emails.length === 0) {
            feedback.textContent = '';
            emailInput.classList.remove('error', 'success');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter(email => !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            feedback.textContent = `Invalid email addresses: ${invalidEmails.join(', ')}`;
            feedback.className = 'input-feedback error';
            emailInput.classList.add('error');
            emailInput.classList.remove('success');
            return false;
        } else {
            feedback.textContent = `${emails.length} valid recipient(s)`;
            feedback.className = 'input-feedback success';
            emailInput.classList.remove('error');
            emailInput.classList.add('success');
            return true;
        }
    }

    selectInstruction(instruction) {
        document.getElementById('instructions-input').value = instruction;
        this.showStatus('Instruction selected: ' + instruction, 'info');
    }

    async generateSummary() {
        if (!this.validateTranscript()) {
            this.showStatus('Please provide a valid meeting transcript before generating a summary.', 'error');
            return;
        }

        const generateBtn = document.getElementById('generate-btn');
        const transcript = document.getElementById('transcript-input').value.trim();
        const instructions = document.getElementById('instructions-input').value.trim();
        
        // Clear any existing timeout
        if (this.processingTimeout) {
            clearTimeout(this.processingTimeout);
        }
        
        // Show loading state
        this.setButtonLoading(generateBtn, true);
        this.disableInputs(true);
        
        try {
            // Set timeout for maximum processing time
            const timeoutPromise = new Promise((_, reject) => {
                this.processingTimeout = setTimeout(() => {
                    reject(new Error('Processing timeout - please try again'));
                }, this.maxProcessingTime);
            });
            
            // Simulate AI processing time (2-4 seconds)
            const processingPromise = (async () => {
                await this.delay(2000 + Math.random() * 2000);
                return await this.mockAISummarization(transcript, instructions);
            })();
            
            // Race between processing and timeout
            const summary = await Promise.race([processingPromise, timeoutPromise]);
            
            // Clear timeout on success
            if (this.processingTimeout) {
                clearTimeout(this.processingTimeout);
                this.processingTimeout = null;
            }
            
            // Display the summary
            document.getElementById('summary-output').value = summary;
            this.showSection('summary-section');
            this.showSection('email-section');
            
            this.updateWordCount();
            this.updateEmailPreview();
            
            this.showStatus('Summary generated successfully! You can now edit it or share via email.', 'success');
            
        } catch (error) {
            // Clear timeout on error
            if (this.processingTimeout) {
                clearTimeout(this.processingTimeout);
                this.processingTimeout = null;
            }
            
            this.showStatus('Error generating summary: ' + error.message, 'error');
            console.error('Generation error:', error);
        } finally {
            this.setButtonLoading(generateBtn, false);
            this.disableInputs(false);
        }
    }

    async regenerateSummary() {
        const regenerateBtn = document.getElementById('regenerate-btn');
        const transcript = document.getElementById('transcript-input').value.trim();
        const instructions = document.getElementById('instructions-input').value.trim();
        
        this.setButtonLoading(regenerateBtn, true);
        
        try {
            // Shorter timeout for regeneration
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Regeneration timeout - please try again'));
                }, 5000);
            });
            
            const processingPromise = (async () => {
                await this.delay(1000 + Math.random() * 1000);
                return await this.mockAISummarization(transcript, instructions);
            })();
            
            const summary = await Promise.race([processingPromise, timeoutPromise]);
            
            document.getElementById('summary-output').value = summary;
            this.updateWordCount();
            this.updateEmailPreview();
            this.showStatus('Summary regenerated with fresh AI processing!', 'success');
        } catch (error) {
            this.showStatus('Error regenerating summary: ' + error.message, 'error');
            console.error('Regeneration error:', error);
        } finally {
            this.setButtonLoading(regenerateBtn, false);
        }
    }

    async mockAISummarization(transcript, instructions) {
        // Simulate realistic AI processing with context-aware summarization
        
        try {
            const defaultInstruction = instructions || "Create a comprehensive summary";
            
            // Extract key information from transcript
            const speakers = this.extractSpeakers(transcript);
            const topics = this.extractTopics(transcript);
            const numbers = this.extractNumbers(transcript);
            const actionItems = this.extractActionItems(transcript);
            
            // Generate summary based on instruction type
            if (instructions.toLowerCase().includes('bullet') || instructions.toLowerCase().includes('executive')) {
                return this.generateBulletSummary(speakers, topics, numbers, actionItems);
            } else if (instructions.toLowerCase().includes('action') || instructions.toLowerCase().includes('deadline')) {
                return this.generateActionItemsSummary(actionItems);
            } else if (instructions.toLowerCase().includes('metric') || instructions.toLowerCase().includes('data')) {
                return this.generateMetricsSummary(numbers, topics);
            } else if (instructions.toLowerCase().includes('decision') || instructions.toLowerCase().includes('next step')) {
                return this.generateDecisionsSummary(actionItems, topics);
            } else {
                return this.generateComprehensiveSummary(speakers, topics, numbers, actionItems);
            }
        } catch (error) {
            throw new Error('AI processing failed: ' + error.message);
        }
    }

    extractSpeakers(transcript) {
        try {
            const speakerMatches = transcript.match(/(\w+):/g);
            return speakerMatches ? [...new Set(speakerMatches.map(s => s.replace(':', '')))] : [];
        } catch (error) {
            return [];
        }
    }

    extractTopics(transcript) {
        try {
            const commonTopics = ['sales', 'revenue', 'marketing', 'targets', 'campaign', 'deals', 'supply chain', 
                                 'delivery', 'customer', 'support', 'meeting', 'quarterly', 'performance'];
            return commonTopics.filter(topic => 
                transcript.toLowerCase().includes(topic)
            );
        } catch (error) {
            return [];
        }
    }

    extractNumbers(transcript) {
        try {
            const numberMatches = transcript.match(/\$?[\d,]+\.?\d*[%MK]?/g);
            return numberMatches ? numberMatches.slice(0, 10) : [];
        } catch (error) {
            return [];
        }
    }

    extractActionItems(transcript) {
        try {
            const actionPattern = /(\w+)[:,]?\s*(can you|will|I'll|let's|need to|should)([^.!?]*[.!?])/gi;
            const matches = [];
            let match;
            
            while ((match = actionPattern.exec(transcript)) !== null && matches.length < 5) {
                matches.push({
                    person: match[1],
                    action: match[2] + match[3]
                });
            }
            
            return matches;
        } catch (error) {
            return [];
        }
    }

    generateBulletSummary(speakers, topics, numbers, actionItems) {
        const date = new Date().toLocaleDateString();
        return `# Executive Summary - ${date}

## Key Highlights
• Meeting participants: ${speakers.join(', ')}
• Primary topics discussed: ${topics.slice(0, 5).join(', ')}
${numbers.length > 0 ? `• Key metrics: ${numbers.slice(0, 3).join(', ')}` : ''}

## Main Discussion Points
• Revenue and sales performance review
• Marketing campaign effectiveness analysis
• Operational challenges and solutions
• Customer support improvements

## Action Items
${actionItems.map(item => `• ${item.person}: ${item.action.trim()}`).join('\n')}

## Next Steps
• Follow up on assigned action items
• Monitor progress on operational improvements
• Schedule next review meeting`;
    }

    generateActionItemsSummary(actionItems) {
        const date = new Date().toLocaleDateString();
        return `# Action Items & Deadlines - ${date}

## Immediate Actions Required

${actionItems.map((item, index) => 
    `${index + 1}. **${item.person}**: ${item.action.trim()}`
).join('\n\n')}

## Timeline
• **By Wednesday**: Customer communication template
• **By Friday**: Supply chain resolution plan
• **Next Tuesday 2 PM**: Follow-up meeting

## Priority Level: HIGH
All items require immediate attention to address customer impact and operational efficiency.`;
    }

    generateMetricsSummary(numbers, topics) {
        return `# Performance Metrics & Data Analysis

## Key Performance Indicators
${numbers.length > 0 ? `• Financial metrics: ${numbers.join(', ')}` : '• Various performance metrics discussed'}

## Growth Areas
• Revenue exceeded targets significantly
• Marketing conversion rates showing positive trends
• Enterprise segment performing strongly

## Challenge Areas
• Supply chain efficiency needs improvement
• Customer support volume increasing
• Delivery timelines extended

## Data-Driven Insights
• Strong quarter-over-quarter performance
• Marketing ROI demonstrating positive results
• Operational bottlenecks identified for resolution`;
    }

    generateDecisionsSummary(actionItems, topics) {
        return `# Key Decisions & Next Steps

## Decisions Made
• Approved action plan for supply chain resolution
• Agreed to improve customer communication process
• Decided to prioritize operational efficiency improvements

## Responsibility Assignments
${actionItems.map(item => `• ${item.person}: ${item.action.trim()}`).join('\n')}

## Strategic Focus Areas
• ${topics.slice(0, 3).join('\n• ')}

## Follow-up Required
• Weekly progress check-ins
• Customer feedback monitoring
• Performance metrics review`;
    }

    generateComprehensiveSummary(speakers, topics, numbers, actionItems) {
        const date = new Date().toLocaleDateString();
        return `# Comprehensive Meeting Summary - ${date}

## Meeting Overview
**Participants**: ${speakers.join(', ')}
**Topics Covered**: ${topics.slice(0, 5).join(', ')}

## Discussion Summary
The meeting covered quarterly performance review with positive results in revenue and marketing effectiveness. Key challenges identified include supply chain delays and increased customer support volume.

## Key Metrics
${numbers.length > 0 ? numbers.slice(0, 5).join(', ') : 'Various performance indicators reviewed'}

## Action Items
${actionItems.map((item, index) => 
    `${index + 1}. ${item.person}: ${item.action.trim()}`
).join('\n')}

## Outcomes
• Performance targets exceeded for the quarter
• Action plans established for operational improvements
• Clear ownership assigned for next steps
• Follow-up meeting scheduled

This summary captures the main points discussed and decisions made during the meeting.`;
    }

    async sendEmail() {
        if (!this.validateEmails()) {
            this.showStatus('Please provide valid email addresses before sending.', 'error');
            return;
        }

        const sendBtn = document.getElementById('send-email-btn');
        const emails = document.getElementById('email-recipients').value.split(',').map(e => e.trim()).filter(e => e);
        const subject = document.getElementById('email-subject').value || 'Meeting Summary';
        const summary = document.getElementById('summary-output').value;

        this.setButtonLoading(sendBtn, true);

        try {
            // Simulate email sending with shorter, more reliable timing
            await this.delay(1000 + Math.random() * 500);
            
            // Mock successful email sending
            this.showStatus(`Summary successfully sent to ${emails.length} recipient(s): ${emails.join(', ')}`, 'success');
            
            // Reset email form
            document.getElementById('email-recipients').value = '';
            document.getElementById('email-subject').value = '';
            this.validateEmails();
            this.updateEmailPreview();
            
        } catch (error) {
            this.showStatus('Error sending email: ' + error.message, 'error');
            console.error('Email error:', error);
        } finally {
            this.setButtonLoading(sendBtn, false);
        }
    }

    loadDemo() {
        document.getElementById('transcript-input').value = this.sampleData.transcript;
        document.getElementById('instructions-input').value = this.sampleData.instructions[0];
        
        this.validateTranscript();
        this.showStatus('Demo data loaded! Click "Generate Summary" to see AI processing in action.', 'info');
    }

    clearAll() {
        // Clear any processing timeouts
        if (this.processingTimeout) {
            clearTimeout(this.processingTimeout);
            this.processingTimeout = null;
        }
        
        // Clear all inputs
        document.getElementById('transcript-input').value = '';
        document.getElementById('instructions-input').value = '';
        document.getElementById('summary-output').value = '';
        document.getElementById('email-recipients').value = '';
        document.getElementById('email-subject').value = '';
        
        // Hide sections
        this.hideSection('summary-section');
        this.hideSection('email-section');
        
        // Reset validation states
        this.clearValidationStates();
        this.hideStatus();
        this.updateEmailPreview();
        
        this.showStatus('All data cleared successfully.', 'info');
    }

    updateWordCount() {
        const summary = document.getElementById('summary-output').value;
        const wordCount = summary.trim().split(/\s+/).filter(word => word.length > 0).length;
        document.getElementById('summary-word-count').textContent = `${wordCount} words`;
    }

    updateEmailPreview() {
        const summary = document.getElementById('summary-output').value;
        const subject = document.getElementById('email-subject').value || 'Meeting Summary';
        
        document.getElementById('preview-subject').textContent = subject;
        document.getElementById('preview-summary').textContent = summary || '[Summary will appear here]';
    }

    // Utility methods
    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        section.classList.remove('hidden');
        setTimeout(() => section.classList.add('visible'), 50);
    }

    hideSection(sectionId) {
        const section = document.getElementById(sectionId);
        section.classList.remove('visible');
        setTimeout(() => section.classList.add('hidden'), 250);
    }

    showStatus(message, type = 'info') {
        const statusMessages = document.getElementById('status-messages');
        const statusContent = document.getElementById('status-content');
        
        statusContent.textContent = message;
        statusMessages.className = `status-messages ${type}`;
        statusMessages.classList.remove('hidden');
        
        // Auto-hide info messages after 5 seconds
        if (type === 'info') {
            setTimeout(() => this.hideStatus(), 5000);
        }
    }

    hideStatus() {
        document.getElementById('status-messages').classList.add('hidden');
    }

    setButtonLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const btnSpinner = button.querySelector('.btn-spinner');
        
        if (isLoading) {
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
            button.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
            button.disabled = false;
        }
    }

    disableInputs(disabled) {
        document.getElementById('transcript-input').disabled = disabled;
        document.getElementById('instructions-input').disabled = disabled;
        document.querySelectorAll('.chip').forEach(chip => {
            chip.disabled = disabled;
            chip.style.pointerEvents = disabled ? 'none' : 'auto';
            chip.style.opacity = disabled ? '0.5' : '1';
        });
    }

    clearValidationStates() {
        document.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('error', 'success');
        });
        document.querySelectorAll('.input-feedback').forEach(feedback => {
            feedback.textContent = '';
            feedback.className = 'input-feedback';
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MeetingNotesSummarizer();
});