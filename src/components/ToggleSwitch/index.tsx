import cn from 'classnames/bind';
import useTheme from 'hooks/useTheme';
import styles from './index.module.scss';

const cx = cn.bind(styles);

interface ToggleSwitchInterface {
  id: string;
  name?: string;
  checked: boolean;
  onChange: (isCheck) => void;
  optionLabels?: string[];
  small?: boolean;
  disabled?: boolean;
  customSwitchClass?: string;
}

const ToggleSwitch = ({ id, name, checked, onChange, small, disabled, customSwitchClass }: ToggleSwitchInterface) => {
  const theme = useTheme();

  function handleKeyPress(e) {
    if (e.keyCode !== 32) return;

    e.preventDefault();
    onChange(!checked);
  }

  return (
    <div className={cx('toggle-switch', small ? 'toggle-switch-small-switch' : '', `toggle-switch-${theme}`)}>
      <input
        type="checkbox"
        name={name}
        className={cx('toggle-switch-checkbox')}
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      {id ? (
        <label
          className={cx('toggle-switch-label')}
          tabIndex={disabled ? -1 : 1}
          onKeyDown={(e) => handleKeyPress(e)}
          htmlFor={id}
        >
          <span
            className={cx(
              disabled ? 'toggle-switch-inner toggle-switch-disabled' : 'toggle-switch-inner',
              customSwitchClass || ''
            )}
            // data-yes={optionLabels[0]}
            // data-no={optionLabels[1]}
            tabIndex={-1}
          />
          <span
            className={cx(disabled ? 'toggle-switch-switch toggle-switch-disabled' : 'toggle-switch-switch')}
            tabIndex={-1}
          />
        </label>
      ) : null}
    </div>
  );
};

export default ToggleSwitch;
