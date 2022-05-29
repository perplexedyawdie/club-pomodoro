import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { Client } from "colyseus.js";
import { Constants } from './utils/constants.enum';
import { SocketMessages } from './utils/socket-messages.enum';
import toast, { Toast, Toaster } from 'react-hot-toast';
const client = new Client("ws://localhost:2567");
const notify = () => toast.success('+1 person is studying with you!', {
  id: 'newPerson',
});

interface SyncTimeMsg {
  initialTime: number;
}

interface NewClientMsg {
  clientJoined: boolean;

}

interface ClientCountMsg {
  clientCount: number;
}
function seconds2MinsSecs(remainingSeconds: number): string {
  const minutes: number = Math.floor(remainingSeconds / 60);

  // 👇️ get remainder of seconds
  const seconds: number = remainingSeconds % 60;

  function padTo2Digits(num: number): string {
    return num.toString().padStart(2, '0');
  }
  const result = `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
  return result;
}

function isCooldown(time: number): boolean {
  if (time <= Constants.COOL_DOWN_PERIOD) {
    return true;
  } else {
    return false;
  }
}

const TimeDisplay: React.FC<{ timeInSeconds: number }> = ({ timeInSeconds }) => {

  return (
    <>
      {
        isCooldown(timeInSeconds) ? (
          <div className='flex flex-col items-center justify-center space-y-4'>
          <p className='font-sans text-3xl text-[#5584AC]'>
          {timeInSeconds < 5 ? '🚦 Restarting In 🚦' : '🥶 Cooldown 🥶'}
          </p>
         
          <p className='font-sans text-3xl text-[#5584AC]'>
                 {seconds2MinsSecs(timeInSeconds)}
          </p>
          </div>
          
        ) : (
          <p className='font-sans text-6xl text-[#5584AC]'>
            {seconds2MinsSecs(timeInSeconds)}
          </p>
        )
      }
    </>
  )
}


function App() {
  const socketConnectedRef = useRef<boolean>(false);
  const [initialTime, setInitialTime] = useState<number>(-1)
  const [clientCount, setClientCount] = useState<number>(-1)
  const [clientCountToastId, setClientCountToastId] = useState<string>()
  

  async function connect() {
    try {
      const room = await client.joinOrCreate("club_pomo");

      room.onStateChange((newState) => {
        console.log("New state:", newState);
      });

      room.onLeave((code) => {
        console.log("You've been disconnected.");
      });

      room.onMessage(SocketMessages.TIME_SYNC, (message: SyncTimeMsg) => {
        console.log("message received from server");
        console.log(message.initialTime);
        setInitialTime(message.initialTime);
      });

      room.onMessage(SocketMessages.NEW_CLIENT, (message: NewClientMsg) => {
        console.log('new client message received from server');
        console.log(message.clientJoined)
        notify();
      })

      room.onMessage(SocketMessages.CLIENT_COUNT, (message: ClientCountMsg) => {
        console.log('new client message received from server');
        console.log(message.clientCount)
        setClientCount(message.clientCount)
      })


    } catch (e) {
      console.error("Couldn't connect:", e);
    }
  }

  useEffect(() => {
    if (clientCount > -1 && clientCountToastId) {
      toast.loading(`${clientCount > 1 ? `${clientCount} persons are` : `${clientCount} person is`} studying with you!`, {
        icon: '📚',
        id: clientCountToastId,
      })
    }
  }, [clientCount, clientCountToastId])
  

  useEffect(() => {
    if (socketConnectedRef.current === false) {
      socketConnectedRef.current = true;

      connect()
        .then(() => setClientCountToastId(toast.loading(`${clientCount} persons are studying with you!`, {
          icon: '📚'
        })))
        .catch(console.error)
    }

  }, [])

  return (
    <>
      <header className="flex justify-center items-center px-8 py-8">
        <img src="/assets/header.png" alt="Blue stylized text saying Club Pomodoro" />
      </header>
      <main>
        <section className="h-fit p-8 flex justify-center items-center">
          {
            initialTime > -1 ? (
              <CountdownCircleTimer
                isPlaying
                duration={Constants.DURATION}
                initialRemainingTime={initialTime}
                colors={['#004777', '#F7B801', '#A30000', '#A30000']}
                colorsTime={[900, 600, 300, 0]}
                size={300}
                onComplete={() => {
                  // do your stuff here
                  return { shouldRepeat: true } // repeat animation in 1.5 seconds
                }}
              >
                {({ remainingTime }) => <TimeDisplay timeInSeconds={remainingTime} />}
              </CountdownCircleTimer>
            ) : null
          }

        </section>
        <section className="mt-12 flex flex-col items-center justify-center px-8">

        </section>
      </main>
      <Toaster
      position='bottom-center'
      reverseOrder
      />
    </>
  );
}

export default App;
