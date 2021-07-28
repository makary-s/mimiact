export const {createApp, createComponent} = (() => {
  const mapObject = (obj, fn) => Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = fn(value, key);
    return acc;
  }, {})
  const createState = (state, isDebug = false) => {
    const prototype = {
      get() { return this.value },
      set(value) { Object.values(this.callbacks).forEach(x => x(this.value = value))},
      watch(fn, id) { this.callbacks[id] = fn },
      unwatch(id) { delete this.callbacks[id] }
    };
    const result = mapObject(state, (value, name) => Object.assign(Object.create(prototype), { value, name, callbacks: {} }));
    if (isDebug) window.__STATE__ = result;
    return result;
  }
  const createComponent = (getOptions, stateMappers) => ({ key: currentKey, ...props }) => function update(parentKey, cashedData = {}, state, isDebug) {
    if (!currentKey) throw new Error(`${parentKey}'s child needs a key!`);
    const key = `${parentKey}:${currentKey}`;
    const { props: stateProps = [], actions = {} } = stateMappers || {};
    (cashedData.stateProps || []).map(name => state[name].unwatch(key));
    const statePropsMap = (stateProps).reduce((acc, name) => {
      acc[name] = state[name].get();
      state[name].watch(() => update(parentKey, cashedData, state), key);
      return acc;
    }, {});
    const stateActionsMap = mapObject(actions, ([prop, fn], name) => (...args) => state[prop].set(fn(state[prop].get())(...args)));
    const newOptions = getOptions(props, { ...statePropsMap, ...stateActionsMap });
    if (newOptions.children && !Array.isArray(newOptions.children)) {
      newOptions.attrs = Object.assign(newOptions.attrs || {}, { textContent: String(newOptions.children) });
      newOptions.children = null;
    }
    const el = cashedData.el || document.createElement(newOptions.tag || 'div');
    if (isDebug) Object.assign(el.dataset, { key: currentKey }); // для наглядности :)
    const children = (newOptions.children || []).map(child => child(key, cashedData ?.children ?.[child.key] ?.cashedData ?? {}, state, isDebug));
    const newCashedData = {
      el,
      styles: mapObject(newOptions.styles || {}, (_, name) => el.style[name]),
      attrs: mapObject(newOptions.attrs || {}, (_, name) => el[name]),
      stateProps,
      children: children.reduce((acc, child) => {
        acc[child.key] = child
        return acc
      }, {}),
      events: newOptions.events
    };
    el.textContent = "";
    Object.assign(el.style, cashedData.styles, newOptions.styles);
    Object.assign(el, cashedData.attrs, newOptions.attrs);
    Object.entries(cashedData.events || {}).forEach(([name, fn]) => el.removeEventListener(name, fn));
    Object.entries(newOptions.events || {}).map(([name, fn]) => el.addEventListener(name, fn));
    children.forEach(child => el.appendChild(child.el))
    Object.assign(cashedData, newCashedData) // мутируем
    return { key, el, cashedData: newCashedData }
  };
  const createApp = ({ component, element, state = {}, isDebug }) => {
    const result = component({ key: '~' })('', {}, createState(state, isDebug), isDebug);
    element.appendChild(result.el);
  }
  return {createComponent, createApp}
})()
