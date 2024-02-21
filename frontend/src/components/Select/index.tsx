import { useState } from "react"
import styles from './styles.module.scss'
import { CaretDown, CaretUp } from "phosphor-react";

interface SelectProps {
  placeholder: string;
  options: string[];
  onChangeSelect: (option: string) => void
}


export function Select({ placeholder, options, onChangeSelect }: SelectProps) {
  const[openList, setOpenList] = useState(false)
  const[label, setLabel] = useState(placeholder)
  const[optionChanged, setOptionChanged] = useState(false); 

  function toggleOpenList() {
    setOpenList(prev => !prev)
  }

  function handleSelect(option: string) {
    setLabel(option)

    toggleOpenList()

    onChangeSelect(option)
    setOptionChanged(true)
  }

  return (
    <div className={styles.container}>
      <button type="button" className={styles.label} onClick={toggleOpenList} style={{ color: optionChanged ? "#202020" : ''}}>
        {label}

        {openList ? <CaretUp color="#4e4e4e" /> : <CaretDown color="#4e4e4e" /> }
      </button>

      {
        openList && (
          <ul className={styles.list}>
            {options.map(option => (
              <li 
                key={option} 
                onClick={() => handleSelect(option)} 
                className={`${label === option && styles.selectedOption}`}>
                {option}
              </li>
            ))}
          </ul>
        )
      }
    </div>
  )
}