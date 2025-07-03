import React from 'react';
import styles from '../styles/MovesTable.module.css';

const MovesTable = ({ moves }) => {
  return (
    <div className={styles.movesTable}>
      {/* <div>Game Moves</div> */}
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th colSpan="2">White</th>
              <th colSpan="2">Black</th>
            </tr>
            <tr>
              <th></th>
              <th>From</th>
              <th>To</th>
              <th>From</th>
              <th>To</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((move) => (
              <tr key={move.number}>
                <td>{move.number}</td>
                <td>{move.whiteFrom}</td>
                <td>{move.whiteTo}</td>
                <td>{move.blackFrom}</td>
                <td>{move.blackTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MovesTable;