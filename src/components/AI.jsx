import { useState, useEffect, useRef } from 'react';
import './CSS/AI.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// history limit, possibly 100?
// prompt is getting too big with history and json
// try priming the AI with the data/setup first then subsequent requests only have users prompt?

export default function AIAssistant({ taskList, username }) {
	const [history, setHistory] = useState([]);
	const [formData, setFormData] = useState('');
	const [currentPromptList, setCurrentPromptList] = useState([]);
	const [response, setResponse] = useState('');
	const [responseList, setResponseList] = useState([]);
	const [msg, setMsg] = useState('');
	const scrollRef = useRef(null);
	const [formattedTaskData, setFormattedTaskData] = useState('');
	const hasMounted = useRef(false);
	const [isOpen, setIsOpen] = useState(false);
	let prompt = '';

  // format the array of tasks
	const formatTaskData = () => {
		let formattedData = [];
		for (let i = 0; i < taskList.length; i++) {
			formattedData.push(
				`(Task ${i + 1}: (Task name: ${taskList[i].task_name}. Task description: ${
					taskList[i].task_desc
				}. Task status: ${taskList[i].status}))`
			);
		}
		const data = formattedData.join(', ').trim();

		setFormattedTaskData(data);
	};

	useEffect(() => {
		if (hasMounted.current) return;
		hasMounted.current = true;

		// prompt the AI with 'Hello' to spin up the AI and also to add a message in the chat
		prompt = `I am ${username}, Hello, please introduce yourself.`;
		setCurrentPromptList(prev => [...prev, prompt]);
		getResponse();
	}, []);

	useEffect(() => {
		formatTaskData();
	}, [taskList]);

	// scroll to bottom of ai chat log when new response
	useEffect(() => {
		const scroll = scrollRef.current;
		if (!scroll) return;
		scroll.scrollTo({ top: scroll.scrollHeight - scroll.clientHeight, behavior: 'smooth' });
	}, [responseList]);

	const onChange = e => {
		const { value } = e.target;
		setFormData(value);
	};

	const getUserPrompt = text => {
		const setup = `This sessions conversation history: ${history.join(
			' '
		)}. The current list of tasks in JSON format: ${formattedTaskData}. The users username is ${username}. ${username}'s prompt for you to respond to: `;
		const userPrompt = text;
		prompt = `${setup} ${userPrompt}.`;
		setCurrentPromptList(prev => [...prev, text]);
	};

	const getResponse = async () => {
		console.info('User prompt:', prompt);

		setMsg('Thinking...');

		try {
			const resp = await fetch(`${API_BASE}/generate`, {
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
			addResponseToList(data.response);

			setHistory(prev => [...prev, `user: ${formData}, assistant: ${data.response}`]);
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
								<p
									className='userPrompt'
									style={responseList.indexOf(item) === 0 ? { display: 'none' } : {}}
								>
									{currentPromptList[responseList.indexOf(item)]}
								</p>
								<p className='response-container'>{item}</p>
							</div>
						</li>
					))}
				</ul>
			</pre>
		);
	};

	const handleKeyDown = e => {
		if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
			e.preventDefault();
			handleOnSubmit(e);
			setFormData('');
		}
	};

	const handleOnSubmit = e => {
		e.preventDefault();
		if (!formData.trim()) return;

		getUserPrompt(formData);
		setFormData('');
		getResponse();
	};

	const toggleAiModalWindow = () => {
		setIsOpen(prev => !prev);
	};

	return (
		<div className={isOpen ? 'ai-modal-window ai-modal-open' : 'ai-modal-window ai-modal-closed'}>
			<button
				className='ai-modal-btn'
				onClick={toggleAiModalWindow}
			>
				{isOpen ? <p>▶</p> : <p>💬</p>}
			</button>

			<div className='assistant-container'>
				<h2>AI assistant</h2>
				<div
					className='ai-scroll-area'
					ref={scrollRef}
				>
					<div className='response-area'>
						<ResponseListComponent />
						{msg && <p className='ai-message'>{msg}</p>}
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
		</div>
	);
}
