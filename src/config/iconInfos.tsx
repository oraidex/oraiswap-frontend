import AiriIcon from 'assets/icons/airi.svg?react';
import AtomIcon from 'assets/icons/atom_cosmos.svg?react';
import BnbIcon from 'assets/icons/bnb.svg?react';
import EthIcon from 'assets/icons/ethereum.svg?react';
import KwtIcon from 'assets/icons/kwt.svg?react';
import MilkyIcon from 'assets/icons/milky-token.svg?react';
import OraiIcon from 'assets/icons/oraichain.svg?react';
import BTCIcon from 'assets/icons/btc-icon.svg?react';
import OraiLightIcon from 'assets/icons/oraichain_light.svg?react';
import defaultTokenImg from 'assets/icons/tokens.svg';
import OraixIcon from 'assets/icons/oraix.svg?react';
import OraixLightIcon from 'assets/icons/oraix_light.svg?react';
import OsmoIcon from 'assets/icons/osmosis_light.svg?react';
import ScOraiIcon from 'assets/icons/orchai.svg?react';
import UsdtIcon from 'assets/icons/tether.svg?react';
import TronIcon from 'assets/icons/tron.svg?react';
import UsdcIcon from 'assets/icons/usd_coin.svg?react';
import ScAtomIcon from 'assets/icons/scatom.svg?react';
import InjIcon from 'assets/icons/inj.svg?react';
import NobleIcon from 'assets/icons/noble.svg?react';
import NobleLightIcon from 'assets/icons/ic_noble_light.svg?react';
import TimpiIcon from 'assets/icons/timpiIcon.svg?react';
import NeutaroIcon from 'assets/icons/neutaro.svg?react';
import OrchaiIcon from 'assets/icons/orchaiIcon.svg?react';
import BitcoinIcon from 'assets/icons/bitcoin.svg?react';
import CelestiaIcon from 'assets/icons/celestia.svg?react';
import TonIcon from 'assets/icons/ton.svg?react';
import PepeIcon from 'assets/icons/pepe.svg?react';
import CatIcon from 'assets/icons/icon-simoncat.svg?react';
import HmstrIcon from 'assets/icons/hmstr.svg?react';
import { CustomChainInfo, TokenItemType } from '@oraichain/oraidex-common';
import { bitcoinChainId } from 'helper/constants';
import { FC, useEffect, useRef, useState } from 'react';
import { FastAverageColor } from 'fast-average-color';

export type TokenIcon = Pick<TokenItemType, 'coinGeckoId' | 'Icon' | 'IconLight'>;
// @ts-ignore
export type ChainIcon = Pick<CustomChainInfo, 'chainId' | 'Icon' | 'IconLight'>;

export const tokensIconInfos: TokenIcon[] = [
  {
    coinGeckoId: 'oraichain-token',
    Icon: OraiIcon,
    IconLight: OraiLightIcon
  },
  {
    coinGeckoId: 'usd-coin',
    Icon: UsdcIcon,
    IconLight: UsdcIcon
  },
  {
    coinGeckoId: 'bitcoin',
    Icon: BTCIcon,
    IconLight: BTCIcon
  },
  {
    coinGeckoId: 'airight',
    Icon: AiriIcon,
    IconLight: AiriIcon
  },
  {
    coinGeckoId: 'tether',
    Icon: UsdtIcon,
    IconLight: UsdtIcon
  },
  {
    coinGeckoId: 'tron',
    Icon: TronIcon,
    IconLight: TronIcon
  },
  {
    coinGeckoId: 'kawaii-islands',
    Icon: KwtIcon,
    IconLight: KwtIcon
  },
  {
    coinGeckoId: 'milky-token',
    Icon: MilkyIcon,
    IconLight: MilkyIcon
  },
  {
    coinGeckoId: 'osmosis',
    Icon: OsmoIcon,
    IconLight: OsmoIcon
  },
  {
    coinGeckoId: 'injective-protocol',
    Icon: InjIcon,
    IconLight: InjIcon
  },
  {
    coinGeckoId: 'cosmos',
    Icon: AtomIcon,
    IconLight: AtomIcon
  },
  {
    coinGeckoId: 'weth',
    Icon: EthIcon,
    IconLight: EthIcon
  },
  {
    coinGeckoId: 'ethereum',
    Icon: EthIcon,
    IconLight: EthIcon
  },
  {
    coinGeckoId: 'wbnb',
    Icon: BnbIcon,
    IconLight: BnbIcon
  },
  {
    coinGeckoId: 'binancecoin',
    Icon: BnbIcon,
    IconLight: BnbIcon
  },
  {
    coinGeckoId: 'oraidex',
    Icon: OraixIcon,
    IconLight: OraixLightIcon
  },
  {
    coinGeckoId: 'scorai',
    Icon: ScOraiIcon,
    IconLight: ScOraiIcon
  },
  {
    coinGeckoId: 'scatom',
    Icon: ScAtomIcon,
    IconLight: ScAtomIcon
  },
  {
    coinGeckoId: 'neutaro',
    Icon: TimpiIcon,
    IconLight: TimpiIcon
  },
  {
    coinGeckoId: 'och',
    Icon: OrchaiIcon,
    IconLight: OrchaiIcon
  },
  {
    coinGeckoId: 'bitcoin',
    Icon: BitcoinIcon,
    IconLight: BitcoinIcon
  },
  {
    coinGeckoId: 'celestia',
    Icon: CelestiaIcon,
    IconLight: CelestiaIcon
  },
  {
    coinGeckoId: 'the-open-network',
    Icon: TonIcon,
    IconLight: TonIcon
  },
  {
    coinGeckoId: 'pepe',
    Icon: PepeIcon,
    IconLight: PepeIcon
  },
  {
    coinGeckoId: 'simon-s-cat',
    Icon: CatIcon,
    IconLight: CatIcon
  },
  {
    coinGeckoId: 'hamster-kombat',
    Icon: HmstrIcon,
    IconLight: HmstrIcon
  }
];

export const chainIconsInfos: ChainIcon[] = [
  {
    chainId: 'Oraichain',
    Icon: OraiIcon,
    IconLight: OraiLightIcon
  },
  {
    chainId: bitcoinChainId,
    Icon: BTCIcon,
    IconLight: BTCIcon
  },
  {
    chainId: 'kawaii_6886-1',
    Icon: KwtIcon,
    IconLight: KwtIcon
  },
  {
    chainId: 'osmosis-1',
    Icon: OsmoIcon,
    IconLight: OsmoIcon
  },
  {
    chainId: 'injective-1',
    Icon: InjIcon,
    IconLight: InjIcon
  },
  {
    chainId: 'cosmoshub-4',
    Icon: AtomIcon,
    IconLight: AtomIcon
  },
  {
    chainId: '0x01',
    Icon: EthIcon,
    IconLight: EthIcon
  },
  {
    chainId: '0x2b6653dc',
    Icon: TronIcon,
    IconLight: TronIcon
  },
  {
    chainId: '0x38',
    Icon: BnbIcon,
    IconLight: BnbIcon
  },
  {
    chainId: '0x1ae6',
    Icon: KwtIcon,
    IconLight: KwtIcon
  },
  {
    chainId: 'noble-1',
    Icon: NobleIcon,
    IconLight: NobleLightIcon
  },
  {
    chainId: 'Neutaro-1',
    Icon: NeutaroIcon,
    IconLight: NeutaroIcon
  },
  {
    chainId: 'oraibtc-mainnet-1',
    Icon: BitcoinIcon,
    IconLight: BitcoinIcon
  },
  {
    chainId: 'celestia',
    Icon: CelestiaIcon,
    IconLight: CelestiaIcon
  }
];

const renderIcon = (url) => {
  const [bgColor, setBgColor] = useState('#fff'); // Default color
  // const fac = new FastAverageColor();
  // fac
  //   .getColorAsync(url, {
  //     ignoredColor: [
  //       // [255, 255, 255, 255], // white
  //       // [0, 0, 0, 255] // black
  //     ]
  //   })
  //   .then((color) => {
  //     setBgColor(color.rgba);
  //   })
  //   .catch((e) => {
  //     // console.log('error gen color', e);
  //   });

  return (
    <div style={{ backgroundColor: bgColor, display: 'inline-block', borderRadius: '50%' }}>
      <img src={url} alt="Image" style={{ display: 'block', borderRadius: '50%' }} />
    </div>
  );

  // return <img src={url} alt="icon" />;
};

export const ImageBackgroundDetector = ({ imageUrl }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.src = imageUrl;

    image.onload = () => {
      // Draw the image onto the canvas
      ctx.drawImage(image, 0, 0);

      // Get the pixel data of the top-left corner (position: 0,0)
      const pixelData = ctx.getImageData(0, 0, 1, 1).data;

      // Extract RGB values from the pixel data
      const [red, green, blue] = pixelData;

      // Convert RGB values to hex code
      const hexCode = rgbToHex(red, green, blue);

      console.log('Background color:', hexCode);
    };
  }, [imageUrl]);

  // Helper function to convert RGB values to hex code
  const rgbToHex = (r, g, b) => `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;

  return <canvas ref={canvasRef} />;
};

export const mapListWithIcon = (list: any[], listIcon: ChainIcon[] | TokenIcon[], key: 'chainId' | 'coinGeckoId') => {
  return list.map((item) => {
    const iconUrl = item.Icon ? item.Icon : defaultTokenImg;
    const iconLightUrl = item.IconLight ? item.IconLight : defaultTokenImg;

    // const findedItem = listIcon.find((icon) => icon[key] === item[key]);

    const Icon = () => renderIcon(iconUrl);
    const IconLight = () => renderIcon(iconLightUrl);

    return {
      ...item,
      Icon,
      IconLight
    };
  });
};

export const mapListWithIconComponent = (
  list: any[],
  listIcon: ChainIcon[] | TokenIcon[],
  key: 'chainId' | 'coinGeckoId'
) => {
  return list.map((item) => {
    let Icon = OraiIcon;
    let IconLight = OraiLightIcon;

    const findedItem = listIcon.find((icon) => icon[key] === item[key]);
    if (findedItem) {
      Icon = findedItem.Icon;
      IconLight = findedItem.IconLight;
    }

    return {
      ...item,
      Icon,
      IconLight
    };
  });
};