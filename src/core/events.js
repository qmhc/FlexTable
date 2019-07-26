// 记录按键
const recorder = []

export const getKeyState = code => {
	const key = recorder.find(item => item.code === code)

	if (key) {
		return key.state
	}

	return false
}

export const registerKey = code => {
	if (recorder.find(item => item.code === code)) {
		throw new Error(`The Key coded '${code}' has been registered`)
	}

	recorder.push({
		state: false,
		code: code
	})
} 

export const isKeyRegistered = code => !!~recorder.findIndex(item => item.code === code)

document.addEventListener('keydown', ev => {
	const code = ev.keyCode
	const key = recorder.find(item => item.code === code)
	if (key) {
		key.state = true
	}
})

document.addEventListener('keyup', ev => {
	const code = ev.keyCode
	const key = recorder.find(item => item.code === code)
	if (key) {
		key.state = false
	}
})
