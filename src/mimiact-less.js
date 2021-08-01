/* Здесь пытаюсь создать более компактную версию mimiact.js
 * - стили задаются через attrs.styles
 * - текст задается через textContent, а не children
 * - нет учета жизненного цикла
 */
export const { createApp, createComponent } = (() => {
  const mapObject = (obj, fn, defacc = {}) => Object.entries(obj || {}).reduce((acc, [key, value]) => {
    const [newValue, newKey] = fn(value, key) || [];
    acc[newKey ?? key] = newValue;
    return acc;
  }, defacc);
  const createState = (state, isDebug = false) => {
    const prototype = {
      get() { return this.value },
      set(value) { Object.values(this.callbacks).forEach(x => x(this.value = value)) },
      watch(fn, id) { this.callbacks[id] = fn },
      unwatch(id) { delete this.callbacks[id] }
    };
    const result = mapObject(state, (value, name) => [Object.assign(Object.create(prototype), { value, name, callbacks: {} })]);
    if (isDebug) window.__STATE__ = result;
    return result;
  };
  const cash = {};
  const createComponent = (getOptions, stateMappers) => (props = {}) =>
    function update ({ parentKey, state, isDeleting = false, isDebug, i}) {
      const key = `${parentKey}:${props.key || i}`;
      // self
      const self = cash[key] ? cash[key] : {}
      cash[key] = self;
      // stateProps
      const { props: stateProps = [], actions = {} } = stateMappers || {};
      (self.stateProps || []).map(name => state[name].unwatch(key));
      self.stateProps = stateProps;
      const statePropsMap = mapObject(stateProps, (name) => {
        state[name].watch(() => update({ parentKey, state, isDebug }), key);
        return [state[name].get(), name]
      } )
      const stateActionsMap = mapObject(actions, ([prop, fn], name) => 
        [(...args) => state[prop].set(fn(state[prop].get())(...args))]
      );
      // newOptions
      let {
        tag = 'div', events = {}, attrs = {}, children = [], styles = {},
      } = getOptions(props, { ...statePropsMap, ...stateActionsMap }, self);
      // el
      const el = self.el = self.el ?.tagName.toLowerCase() === tag ? self.el : document.createElement(tag);
      if (isDebug) Object.assign(el.dataset, { key: props.key || i });
      // attrs
      const oldAttrs = mapObject(attrs, (_, name) => [self.oldAttrs?.[name] ?? el[name]])
      Object.assign(el, self.oldAttrs, attrs);
      self.oldAttrs = oldAttrs;
      // events
      Object.entries(self.events || {}).forEach(([name, fn]) => el.removeEventListener(name, fn));
      Object.entries(events).map(([name, fn]) => el.addEventListener(name, fn));
      self.events = events;
      // children
      let prevKey = null;
      const newChildren = mapObject(children, (childUpdate, i) => {
        const child = childUpdate({ parentKey: key, prevKey, state, isDebug, i });
        if ((self.children?.[child.key]?.prevKey !== prevKey)) el.appendChild(child.el);
        child.prevKey = prevKey;
        prevKey = child.key;
        return [child, child.key];
      });
      Object.entries(self.children || {}).forEach(([key, child]) => {
        if (!(key in newChildren)) {
          delete cash[key];
          child.el.remove();
        }
      });
      self.children = mapObject(newChildren, (child) => [child, child.key]);
      return self
    }
  const createApp = ({ component, element, state = {}, isDebug }) => {
    const result = component({ key: '~' })({ parentKey: '', state: createState(state, isDebug), isDebug });
    element.appendChild(result.el);
  }
  return { createComponent, createApp }
})()
