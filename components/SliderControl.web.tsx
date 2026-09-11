import React from 'react';
import type Slider from '@react-native-community/slider';

/** HTML range supplies keyboard and screen-reader support missing in the web adapter. */
export default function SliderControl(props: React.ComponentProps<typeof Slider>) {
  return <>
    <style>{`
      #budget-amount { background:linear-gradient(105deg,#1a1a1a 6%,#34c759 28%,#1a1a1a 51%); background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
      .budget-range { appearance:none; -webkit-appearance:none; width:100%; height:64px; background:transparent; margin:0; cursor:grab; }
      .budget-range::-webkit-slider-runnable-track { height:16px; background:transparent; }
      .budget-range::-webkit-slider-thumb { appearance:none; -webkit-appearance:none; width:64px; height:64px; margin-top:-24px; border:0; border-radius:50%; background:transparent; }
      .budget-range::-moz-range-track { height:16px; background:transparent; }
      .budget-range::-moz-range-thumb { width:64px; height:64px; border:0; background:transparent; }
      .budget-range:focus-visible { outline:2px solid #2E9E45; outline-offset:6px; border-radius:32px; }
    `}</style>
    <input className="budget-range" type="range" aria-label={props.accessibilityLabel}
      aria-valuetext={`€${props.value} per week`} min={props.minimumValue} max={props.maximumValue}
      step={props.step} value={props.value} disabled={props.disabled}
      onChange={event => props.onValueChange?.(Number(event.target.value))} />
  </>;
}
