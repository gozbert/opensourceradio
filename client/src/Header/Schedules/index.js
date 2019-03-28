import React from 'react';
import cn from 'classnames';
import stylish from '@dmamills/stylish';

import fillEmptyTime from './fillEmptyTime';
import Schedule from './Schedule';

import { flex, spaceBetween, mainTheme, whiteText, p1, p0 } from '../../styles';

const modalContainer = stylish({
  position: 'absolute',
  top: '50px',
  right: '0',
  height: '600px',
  width: '600px',
  overflowY: 'scroll',
  padding: '1rem',
});

const Schedules = ({ schedules }) => {
  schedules = fillEmptyTime(schedules);
  return (
    <div className={cn(modalContainer, mainTheme, whiteText)}>
      <div className={cn(flex, spaceBetween, p1)}>
        <h1>Todays Schedules</h1>
      </div>
      <ul className={p0}>
        {schedules.map(s => <Schedule schedule={s} />)}
      </ul>
    </div>
  );
}

export default Schedules;
