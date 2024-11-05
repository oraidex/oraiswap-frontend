import cn from 'classnames/bind';
import { useState } from 'react';
import styles from './NewTokenModal.module.scss';
import PlusIcon from 'assets/icons/plus.svg?react';
import Input from 'components/Input';
import SuccessIcon from 'assets/icons/success.svg?react';
import TokensIcon from 'assets/icons/tokens.svg?react';
import { OraiswapTokenQueryClient } from '@oraichain/oraidex-contracts-sdk';
import CheckBox from 'components/CheckBox';
import { getPoolTokens } from 'config/pools';

const cx = cn.bind(styles);

export const AddTokenStatus = ({ status }) => {
  if (status === null) return <></>;
  return (
    <div
      style={{
        paddingTop: 4,
        color: !status ? 'rgba(255, 47, 54, 1)' : 'rgba(6, 201, 88, 1)',
        fontSize: 12,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {!status ? (
        <div>This address is not a valid CW20 token! </div>
      ) : (
        <>
          <div style={{ paddingRight: 4 }}>Added CW20 token successfully</div>
          <SuccessIcon />
        </>
      )}
    </div>
  );
};

export const ModalListToken = ({
  setIsAddListToken,
  rewardTokens,
  setRewardTokens,
  allRewardSelect,
  tokensNew,
  setTokensNew,
  theme
}) => {
  const [contractAddr, setContractAddr] = useState('');
  const [isAddToken, setIsAddToken] = useState(null);
  const [isToken, setIsToken] = useState(false);
  return (
    <div className={cx('dropdown-reward')}>
      <div>
        <div className={cx('label')}>Enter a valid CW20 token address for the pool's reward</div>
        <div className={cx('check')}>
          <Input
            value={contractAddr}
            className={cx('input', theme)}
            onChange={(e) => setContractAddr(e?.target?.value)}
            placeholder="0xd3f2jlwxt...1f009"
          />
          <div
            className={cx('btn')}
            onClick={async () => {
              try {
                if (!contractAddr) return;
                const cw20Token = new OraiswapTokenQueryClient(window.client, contractAddr);
                await cw20Token.tokenInfo();

                const existContractAddress = [...getPoolTokens(), ...tokensNew].find(
                  (e) => e.contractAddress === contractAddr
                );
                if (existContractAddress) return setIsAddToken(false);
                setTokensNew([
                  ...tokensNew,
                  {
                    contractAddress: contractAddr,
                    name: `New Token ${contractAddr?.slice(contractAddr?.length - 4, contractAddr?.length)}`,
                    denom: `New Token ${contractAddr?.slice(contractAddr?.length - 4, contractAddr?.length)}`
                  }
                ]);
                setIsAddToken(true);
              } catch (error) {
                console.log({ error });
                setIsAddToken(false);
              }
            }}
          >
            <div style={{ opacity: contractAddr ? 1 : 0.5 }}>
              <PlusIcon className={cx('plus')} />
              <span>Add Token</span>
            </div>
          </div>
        </div>
        <AddTokenStatus status={isAddToken} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            paddingTop: 10
          }}
        >
          <CheckBox radioBox label="Token" checked={!isToken} onCheck={() => isToken && setIsToken(false)} />
          <CheckBox radioBox label="Native Token" checked={isToken} onCheck={() => !isToken && setIsToken(true)} />
        </div>
        <div className={cx('list')}>
          <ul>
            {[...getPoolTokens(), ...tokensNew]
              .filter((p) => (isToken ? !p.contractAddress : p.contractAddress))
              .filter((pair) => !allRewardSelect.includes(pair.denom))
              .map((t, index) => {
                return (
                  <li
                    key={index + '' + t?.name}
                    onClick={() => {
                      setIsAddListToken(false);
                      setRewardTokens([
                        ...rewardTokens,
                        {
                          denom: t.denom,
                          name: t.name,
                          contract_addr: t?.contractAddress,
                          value: BigInt(1e6)
                        }
                      ]);
                    }}
                  >
                    {t.Icon ? <t.Icon className={cx('logo')} /> : <TokensIcon className={cx('logo')} />}
                    <span className={cx('name', theme)}>{t?.name}</span>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export const ModalDelete = ({
  typeDelete,
  setTypeDelete,
  setSelectedReward,
  selectedReward,
  rewardTokens,
  setRewardTokens,
  initBalances,
  setInitBalances,
  selectedInitBalances,
  setSelectedInitBalances,
  theme
}) => {
  let contentReward = <></>;
  if (typeDelete === 'Reward') {
    contentReward = (
      <div className={cx('content-reward', theme)}>
        Are you sure delete{' '}
        <span>
          {rewardTokens
            .filter((_, i) => selectedReward?.includes(i))
            .map(function (elem) {
              return elem?.denom;
            })
            .join(',')}{' '}
          {typeDelete}
        </span>
        ?
      </div>
    );
  }

  return (
    <div
      className={cx('dropdown-reward')}
      style={{
        width: 430,
        fontSize: 16
      }}
    >
      <div className={cx('title-reward', theme)}>
        <span> Delete {typeDelete}</span>
      </div>
      {contentReward}
      <div className={cx('action')}>
        <div className={cx('btn', 'btn-cancel')} onClick={() => setTypeDelete('')}>
          <span>Cancel</span>
        </div>
        <div
          className={cx('btn', 'btn-delete')}
          onClick={() => {
            if (typeDelete === 'Reward') {
              const filterReward = rewardTokens.filter((e, i) => !selectedReward.includes(i));
              setRewardTokens(filterReward);
              setTypeDelete('');
              setSelectedReward([]);
            }
            if (typeDelete === 'Init Balances') {
              const filterInitBalances = initBalances.filter((e, i) => !selectedInitBalances.includes(i));
              setInitBalances(filterInitBalances);
              setTypeDelete('');
              setSelectedInitBalances([]);
            }
          }}
        >
          <span>Delete</span>
        </div>
      </div>
    </div>
  );
};
