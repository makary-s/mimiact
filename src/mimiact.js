export const {createApp, createComponent} = (() => {
  const mapObject = (obj, fn, defacc = {}) => Object.entries(obj || {}).reduce((acc, [key, value]) => {
    const [newValue, newKey] = fn(value, key)
    acc[newKey ?? key] = newValue;
    return acc;
  }, defacc);
  const createState = (state, isDebug = false) => {
    const prototype = {
      get() { return this.value },
      set(value) { Object.values(this.callbacks).forEach(x => x(this.value = value))},
      watch(fn, id) { this.callbacks[id] = fn },
      unwatch(id) { delete this.callbacks[id] }
    };
    const result = mapObject(state, (value, name) => [Object.assign(Object.create(prototype), { value, name, callbacks: {} })]);
    if (isDebug) window.__STATE__ = result;
    return result;
  };
  const cash = {};
  const createComponent = (getOptions, stateMappers) => ({ key: currentKey, ...props }) => function update({parentKey, state, isDebug}) {
    if (!currentKey) throw new Error(`${parentKey}'s child needs a key!`);
    const key = `${parentKey}:${currentKey}`;
    // self
    let self  = cash[key] ? cash[key] : {
      el: null,
      key,
      events: {},
      children: {},
      oldStyles: {},
      oldAttrs: {},
      stateProps: [],
    }
    cash[key] = self
    // stateProps
    const { props: stateProps = [], actions = {} } = stateMappers || {};
    (self.stateProps).map(name => state[name].unwatch(key));
    self.stateProps = stateProps;
    const statePropsMap = (stateProps).reduce((acc, name) => {
      acc[name] = state[name].get();
      state[name].watch(() => {
        update({parentKey, state, isDebug})
      }, key);
      return acc;
    }, {});
    const stateActionsMap = mapObject(actions, ([prop, fn], name) => [(...args) => state[prop].set(fn(state[prop].get())(...args))]);
    // newOptions
    let {
      tag = 'div', events = {}, attrs = {}, children = [], styles = {},
    } = getOptions(props, { ...statePropsMap, ...stateActionsMap });
    if (!Array.isArray(children)) {
      attrs = Object.assign(attrs || {}, { textContent: String(children) });
      children = [];
    }
    // el
    const el = self.el = self.el?.tagName.toLowerCase() === tag ? self.el : document.createElement(tag);
    if (isDebug) Object.assign(el.dataset, { key: currentKey });
    // styles
    const oldStyles = mapObject(styles, (_, name) => [self.oldStyles[name] ?? el.style[name]])
    Object.assign(el.style, self.oldStyles, styles);
    self.oldStyles = oldStyles;
    // attrs
    const oldAttrs = mapObject(attrs, (_, name) => [self.oldAttrs[name] ?? el[name]])
    Object.assign(el, self.attrs, attrs);
    self.oldAttrs = oldAttrs;
    // events
    Object.entries(self.events).forEach(([name, fn]) => el.removeEventListener(name, fn));
    Object.entries(events).map(([name, fn]) => el.addEventListener(name, fn));
    self.events = events;
    // children
    const newChildren = children.map(child => child({parentKey: key, state, isDebug}));
    newChildren.forEach(child => { 
      if (!(child.key in self.children)) el.appendChild(child.el);
      else delete self.children[child.key]; // останутся только лишние
    });
    mapObject(self.children, ({el, key}) => {
      el.remove();
      delete cash[key];
    });
    self.children = mapObject(newChildren, (child) => [child, child.key]);
    
    return self
  };
  const createApp = ({ component, element, state = {}, isDebug }) => {
    const result = component({ key: '~' })({parentKey: '', state: createState(state, isDebug), isDebug});
    element.appendChild(result.el);
  }
  return {createComponent, createApp}
})()
