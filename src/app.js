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
    background: '#84838375',
    color: 'white',
    flex: 'none',
    fontWeight: 600,
    cursor: 'pointer',
  }
}), {
    actions: {
      add: ['count', (count) => (step) => Math.max(0, Math.min(1, count + step))]
    }
  });

const CountBar = createComponent((_, { count }) => {
  const centerK = Math.abs(count - 0.5) / 0.5;
  const hue = count * 100;
  const lightness =  centerK * -20 + 90;
  const saturation = centerK * 100
  const gap = 24;
  const width = 100;

  return {
    styles: {
      width: `${width + gap}px`,
      height: `${gap}px`,
      marginLeft: `-${gap}px`,
      marginRight: `-${gap}px`,
      zIndex: -1,
      position: 'relative',
      borderRadius: '1000px',
      boxShadow: 'rgba(0, 0, 0, 0.1) 0 0 2px inset',
      background: 'rgba(0, 0, 0, 0.02)',
    },
    children: [
      createComponent(({ size }) => ({
        tag: 'div',
        styles: {
          position: 'absolute',
          width: '100%',
          lineHeight: '24px',
          textAlign: 'center',
          fontFamily: 'arial',
          zIndex: '2',
          fontSize: '10px',
          color: '#777',
        },
        children: `${Math.round(count * 100)}%`,
      }))({ key: 'value' }),
      createComponent(({ size }) => ({
        styles: {
          background: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
          transition: 'all 0.5s cubic-bezier(.17,.84,.44,1)',
          width: '24px',
          transform: `translateX(${width * count}px)`,
          height: '100%',
          borderRadius: '1000px'
        }
      }))({ key: 'fill' }),
    ]
  }
}, {
  props: ['count']
})

export const App = createComponent(() => ({
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
  // props: ['count']
})


