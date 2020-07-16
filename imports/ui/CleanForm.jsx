// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ControlledForm.jsx: super class for controlled form components

import React, { Component } from 'react'
import PropTypes from 'prop-types';


//A simple component to display a toggle option:
export const CheckBoxOption = ({label, checked, onChange, id}) => {
  return(
    <div className='ql-checkbox'>
      <input type='checkbox' checked={checked} onChange={onChange} id={id} />
      <label htmlFor={id}> {label} </label>
    </div>
  )
}

export const CleanTooltip = (props) =>{
  return(
    <div className='ql-tooltip'>
      <div className='ql-tooltip-target'>
        {props.children}
      </div>
      { props.info
        ? <div className='ql-tooltip-info'>
          {props.info}
         </div>
        : ''
      }
    </div>
  )
}