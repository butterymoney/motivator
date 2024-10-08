'use client'
import React, { useState } from 'react'
import AddrAvatar from '@protocols/hyperdrive/components/globals/AddrAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAddRewardUsers } from '@/hooks/reward/useAddRewardUsers'

type Props = {
    userAddr: string
    id: string
    assessorSlot: string
    reward: number | null
    handleUpdate: () => void
}

const ReducedDataUsers = ({
    userAddr,
    reward,
    assessorSlot,
    handleUpdate,
}: Props) => {
    const [points, setPoints] = useState(reward)
    const handlePointsUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPoints(parseInt(e.target.value))
    }
    const { mutateAsync } = useAddRewardUsers({
        assessorSlotID: assessorSlot,
        userAddr: userAddr,
        value: points ? points : 0,
    })

    const handleSubmit = () => {
        handleUpdate()
        mutateAsync()
    }

    return (
        <div className="border w-fit p-4 rounded-md flex flex-col gap-4">
            <AddrAvatar addressName={userAddr} />
            <div className="  flex lg-max:flex-col gap-4">
                <Input
                    type="number"
                    className="w-24"
                    placeholder="Points"
                    onChange={handlePointsUpdate}
                    value={points as number}
                />
                <Button
                    className="w-full lg:w-fit"
                    onClick={() => handleSubmit()}
                >
                    Update
                </Button>
            </div>
        </div>
    )
}

export default ReducedDataUsers
