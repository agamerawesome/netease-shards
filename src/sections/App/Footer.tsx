import { useTranslation } from 'react-i18next';
import { BiLinkExternal } from 'react-icons/bi';
import { BsGithub } from 'react-icons/bs';

function SkyClockFooter() {
  const { t } = useTranslation('footer');
  return (
    <div className='flex flex-col flex-nowrap items-center justify-center gap-x-3 sm:flex-row'>
      <p>{t('originalBy')}</p>
      <a
        target='_blank'
        href='https://sky-shards.pages.dev/en'
        className='z-10 grid cursor-pointer grid-cols-[max-content,min-content,max-content] grid-rows-2 rounded-lg border border-zinc-500 px-2 text-center shadow-2xl shadow-zinc-700'
      >
        <img className='ml-auto mt-1.5 h-4 w-4' src='/icons/favicon-32x32.png' alt='Sky Shards App Icon' />
        <h2 className='mx-2 whitespace-nowrap text-center'>
          <span className='text-sm underline'>Sky Shards</span>
          <span className='text-xs'> by Plutoy</span>
        </h2>
        <BiLinkExternal className='mt-1.5 self-start' />
        <p className='col-span-3 whitespace-normal text-xs'>{t('skyShardsDescription')}</p>
      </a>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslation('footer');

  return (
    <footer className='glass h-32 w-full !py-0 sm:h-28 flex items-center justify-between px-4'>
      {/* Original By section on the left */}
      <div className='flex-1'>
        <SkyClockFooter />
      </div>

      {/* GitHub button on the right */}
      <a
        href='https://github.com/agamerawesome/sky-shards'
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center justify-center p-2 rounded-lg hover:bg-zinc-700 transition-colors'
        title='View on GitHub'
      >
        <BsGithub className='text-xl' />
      </a>
    </footer>
  );
}

export default Footer;