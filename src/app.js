import {createComponent} from './mimiact'

const Row = createComponent(({ children, ...styles }) => ({
  styles: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    ...styles,
  },
  children,
}));

const CountButton = createComponent(({ step }, { add }) => ({
  tag: 'button',
  children: step > 0 ? '+' : '-',
  events: {
    click: () => add(step)
  },
  styles: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    background: 'lightgray',
    color: 'white',
    flex: 'none',
  }
}), {
    actions: {
      add: ['count', (count) => (step) => Math.max(0, Math.min(1, count + step))]
    }
  });

const CountBar = createComponent((_, { count }) => {
  const fullValue = count;
  const emptyValue = 1 - count;
  const transition = 'all 0.3s'

  return {
    styles: {
      width: '50px',
      height: '10px'
    },
    children: [
      Row({
        children: [
          createComponent(({ size }) => ({
            styles: {
              flex: fullValue,
              background: 'red',
              transition
            }
          }))({ key: 'empty' }),
          createComponent(({ size }) => ({
            styles: {
              flex: emptyValue,
              background: 'none',
              transition
            }
          }))({ key: 'full' }),
        ],
        key: 'count-bar-row'
      })
    ]
  }
}, {
  props: ['count']
})

export const App = createComponent((_, { count }) => ({
  children: [
    Row({
      children: [
        CountButton({ step: 0.1, key: 'add-btn' }),
        CountBar({ key: 'count' }),
        CountButton({ step: -0.1, key: 'sub-btn' }),
      ],
      alignItems: 'center',
      key: 'root-row'
    })
  ]
}), {
    props: ['count'],
  })


