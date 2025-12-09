import { useState, useEffect } from 'react';
import './CSS/AI.css';

// start AI on dashboard load
// history limit, possibly 100?
// add ability to respond to users by username

export default function AIAssistant({ taskList }) {
	const [history, setHistory] = useState([]);
	const [formData, setFormData] = useState('');
	let prompt = '';
	//const [currentPrompt, setCurrentPrompt] = useState('');
	const [currentPromptList, setCurrentPromptList] = useState([]);
	const [response, setResponse] = useState('');
	const [responseList, setResponseList] = useState([]);
	const [msg, setMsg] = useState('');
	const taskListJson = JSON.stringify(taskList);

	const onChange = e => {
		const { value } = e.target;
		setFormData(value);
	};

	//Get the users input as the prompt
	const getUserPrompt = text => {
		const setup = `This sessions conversation history: ${history}. The current list of tasks in JSON format: ${taskListJson}. The users prompt for you to respond to: `;
		const userPrompt = text;
		prompt = `${setup} ${userPrompt}.`;
		//setCurrentPrompt(text);
		setCurrentPromptList(prev => [...prev, text]);
	};

	const getResponse = async () => {
		console.info('User prompt:', prompt);

		setMsg('Thinking');

		try {
			const resp = await fetch('http://localhost:3002/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'questy:latest',
					prompt,
				}),
			});

			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const data = await resp.json();

			console.info(`AI response: ${data.response}`);

			setMsg('');
			//console.log('response', data.response);
			setResponse(data.response);
			addResponseToList(data.response);

			setHistory(prev => [...prev, `user: ${formData}, assistant: ${data.response}`]);

			setFormData('');
			//console.log('history', history);
		} catch (error) {
			setMsg(error);
		}
	};

	const addResponseToList = item => {
		setResponseList(prev => [...prev, item]);
		console.log('responseList:', responseList);
	};

	const ResponseListComponent = () => {
		if (!responseList.length) return null;
		return (
			<pre className='ai-response'>
				<ul className='response-list'>
					{responseList.map(item => (
						<li key={responseList.indexOf(item)}>
							<div>
								<p className='userPrompt'>{currentPromptList[responseList.indexOf(item)]}</p>
								<p className='response-container'>{item}</p>
							</div>
						</li>
					))}
				</ul>
			</pre>
		);
	};

	const handleKeyDown = e => {
		// Enter **without** Shift (or Meta/Control) = submit
		if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
			e.preventDefault(); // stop newline insertion
			handleOnSubmit(e); // reuse the same submit logic
			setFormData('');
		}
		// If Shift+Enter (or Ctrl+Enter) we let the default happen → newline
	};

	const handleOnSubmit = e => {
		e.preventDefault();
		if (!formData.trim()) return;

		getUserPrompt(formData);
		getResponse();
	};

	return (
		<div className='assistant-container'>
			<h2>AI assistant</h2>
			<div className='ai-scroll-area'>
				<div className='response-area'>
					<ResponseListComponent />
					{msg && <p>{msg}</p>}
				</div>
			</div>

			<div>
				<div className='ai-input'>
					<form
						className='prompt-form'
						action='#'
						method='POST'
						onSubmit={handleOnSubmit}
					>
						<label htmlFor='prompt'></label>
						<textarea
							className='prompt-field'
							name='prompt'
							id='prompt'
							value={formData}
							onChange={onChange}
							onKeyDown={handleKeyDown}
							placeholder='Ask something...'
						></textarea>
						<div className='prompt-btn'>
							<button
								className='prompt-btn'
								type='submit'
							>
								Send
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
