import styles from './styles.module.scss'
import { Add, Remove } from "@mui/icons-material";

interface QuantityInputProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function QuantityInput({
  onIncrease,
  onDecrease,
  quantity
}: QuantityInputProps) {
  
  
return (
    <div className={styles.container}>
      <button className={styles.iconWrapper} onClick={onDecrease} disabled={quantity <= 1}>
        <Remove sx={{ fontSize: 14 }} />
      </button>
      <input type="number" readOnly value={quantity} min={1} />
      <button  className={styles.iconWrapper} onClick={onIncrease}>
        <Add sx={{ fontSize: 14 }} />
      </button>
    </div>
  );
}