// import './style.scss'

export default class Plugin {
	constructor (tableInstance, options) {
		this.tableInstance = tableInstance
		// 从 options 获取配置项里相关信息, 处理后存入 tableInstance.state
		// 如果担心存在属性的命名冲突, 可以在 state 中创建插件的命名空间
		// 例如 tableInstance.state.myPlugin = { ...someState }
		// init core
	}
	// 实例化后可基于 FlexTable 的完整 state 进行处理
	afterContruct () {}
	// 判断插件是否该使用
	shouldUse () {
		return true
	}
	// 根据表格行数进行处理, 并返回新行数
	beforeRenderBody (count) {}
	// 根据表格数据进行处理, 并返回新数据
	beforeRenderData (data) {}
	beforeCreate () {}
	create () {
		// create code
		this.created = true
	}
	bindEvent () {}
	afterCreate () {}
	// 根据表格行数进行处理
	afterRenderBody (count) {}
	// 根据表格数据进行处理
	afterRenderData (data) {}
}
