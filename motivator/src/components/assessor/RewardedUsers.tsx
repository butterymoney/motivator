import React from 'react'
import { User } from '@/types/data/user'
import ReducedDataUsers from './ReducedDataUsers'
import { Button } from '@/components/ui/button'
import { useGetAssessorSlot } from '@/hooks/assessorSlot/useGetAssessorSlot'
import { useGetRewardedUsers } from '@/hooks/reward/useGetRewardedUsers'
import { useAccount } from 'wagmi'

type Props = {
    value: number
    users: User[]
}

const RewardedUsers = ({ value, users }: Props) => {
    const { address } = useAccount()
    const { data: assessorSlot } = useGetAssessorSlot({
        assessorAddr: address as string,
    })
    const { data: rewardedUsers } = useGetRewardedUsers({
        assessorAddr: assessorSlot?.res?.assessorID as string,
    })

    const buildUsers = () => {
        return (
            <div className="flex flex-wrap lg:flex-col gap-4">
                {users.map((user, index) => (
                    <ReducedDataUsers
                        key={index}
                        userAddr={user.addressName}
                        // actions={user.stat.actions}
                        // pnl={user.pnl}
                        // volume={user.stat.volume}
                        reward={user.reward ? user.reward.amount : 0}
                        id={user.id}
                        assessorSlot={''}
                    />
                ))}
            </div>
        )
    }

    const handleSubmit = () => {
        console.log('submit')
    }
    // TODO HIDE THE COMPONENT IF NO USERS
    return (
        <section className="p-8 h-full w-full lg:w-fit ">
            <div className="border rounded p-4">
                <div className="flex justify-between rounded py-2">
                    <h1 className="font-bold">Summary</h1>
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSubmit}
                            variant={'submit'}
                            className="lg:hidden"
                        >
                            Submit
                        </Button>
                        <div>
                            <p className="font-extralight pl-1 text-xs">
                                Points
                            </p>
                            <p className="font-bold text-right">{value}</p>
                        </div>
                    </div>
                </div>
                {buildUsers()}
                <div className="items-center p-4">
                    <Button
                        onClick={handleSubmit}
                        variant={'submit'}
                        className="w-full max-lg:hidden"
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </section>
    )
}

export default RewardedUsers
