
// QLICKER
// Author: Ryan Martin
//
// CleanTable.jsx: Component for displaying a simple table with fixed header and
// first column

import React, { Component } from 'react'
import PropTypes from 'prop-types';

/**
 * React Component (meteor reactive) to display Question object and send question reponses.
 * @prop {Id} courseId - Id of course to show
 */
export class CleanTable extends Component {

  constructor (props) {
    super(props)

    this.state = {
    }

  }


  render () {

    const rows = this.props.rows
    const headers = this.props.headers

    //Check that there is data, and that it has the right shape:
    if(rows.length <1 || headers.length <1 || rows[0].length<1){
      return <div className='ql-subs-loading'>No data for table</div>
    }

    let nCol = headers.length
    for(let irow=0; irow<rows.length; irow++) {
      if(rows[irow].length != nCol){
        return <div className='ql-subs-loading'>Incorrect format for table</div>
      }
    }

    //Build a row (except for the header row, done directly in render())
    const Row = ({rowData, rowCount}) => {
      let rowItemCount = 0
      return(
        <tr key={'ql-gtr_'+rowCount} className='ql-gt-row-inner'>
          {
            rowData.map((rowItem) => {
              rowItemCount += 1
              if (rowItemCount == 1) {
                return (
                  <th key={'ql-gti_'+rowCount+'_'+rowItemCount} className='ql-gt-row-item'>
                    {rowItem}
                  </th>
                )
              }
              return(
                <td key={'ql-gti_'+rowCount+'_'+rowItemCount} className='ql-gt-row-item'>
                  {rowItem}
                </td>
              )
            })
          }
        </tr>

      )}

    //Render the header row, then the list of rows
    let rowCount = 0
    let hcount = 0
    return(
      <div className='ql-table-scroll'>
        <table>
          <thead>
            <tr>
            {
              headers.map((h) => {
                hcount += 1
                return(
                  <th key={'qlthi_'+hcount}> {h} </th>
                )
              })
            }
            </tr>
          </thead>
          <tbody>
          {
            rows.map( (row) => {
              rowCount += 1
              return(
                <Row key={'tabler'+rowCount} rowData={row} rowCount={rowCount}/>
              )
            })
          }
          </tbody>
        </table>
      </div>
    )
  } // end render
}

CleanTable.propTypes = {
  rows:PropTypes.array.isRequired,
  headers:PropTypes.array.isRequired
}
