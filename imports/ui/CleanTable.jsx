
// QLICKER
// Author: Ryan Martin
//
// CleanTable.jsx: Component for displaying grades from a course

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

/**
 * React Component (meteor reactive) to display Question object and send question reponses.
 * @prop {Id} courseId - Id of course to show
 */
export class _CleanTable extends Component {

  constructor (props) {
    super(props)

    this.state = {
    }

  }


  render () {

    const rows = this.props.rows
    const headers = this.props.headers


    //Display all the items in a row
    const Row = ({rowData, rowCount}) => {
      let rowItemCount = 0
      return(
        <div key={'ql-gtr_'+rowCount} className='ql-gt-row-inner'>
          {
            rowData.map((rowItem) => {
              rowItemCount += 1
              return(
                <div key={'ql-gti_'+rowCount+'_'+rowItemCount} className='ql-gt-row-item'>
                  {rowItem}
                </div>
              )
            })
          }
        </div>

      )}

    //Render the header row, then the list of rows
    let rowCount = 0
    return(
      <div className='ql-gt-table-outer'>
        <div className='ql-gt-row-header'>
          <Row rowData={headers} />
        </div>
        <div className='ql-gt-rows'>

          <div className='ql-gt-rows-fixed-col'>
            {
              rows.map( (row) => {
                rowCount += 1
                return(
                  <div className='ql-gt-row-inner' key={'ql-gtrfc_'+rowCount}>
                    <div className='ql-gt-row-item' > {row[0]} </div>
                  </div>
                )
              })
            }
          </div>

          <div className='ql-gt-rows-scroll-col'>
            {
              rows.map( (row) => {
                rowCount += 1
                return(
                  <Row key={'tabler'+rowCount} rowData={row.slice(1)} rowCount={rowCount}/>
                )
              })
            }
          </div>
        </div>
      </div>
    )
  } // end render
}

export const CleanTable = withTracker((props) => {

  let fakeData = []
  let fakeHeaders = ["Name","L1","L2","A not very smart name", "participation"]

  fakeData.push(["Ryan 1",85, 75, 65, 100])
  fakeData.push(["Ryan 2",65, 75, 85, 100])
  fakeData.push(["Ryan 3",0, 75, 0, 33])

  return {
    rows:fakeData,
    headers:fakeHeaders
  }
})( _CleanTable)



CleanTable.propTypes = {

}
