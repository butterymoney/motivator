import { useGlobalState } from '@/store/globalStore'
import { useGetAssessorSlotIDFromURL } from '@/hooks/global/useGetAssessorSlotIDFromURL'
import { useGetRewardedUsers } from '@/hooks/reward/useGetRewardedUsers'
import { useEffect, useRef, useState } from 'react'

export const useGetTotalPointsDistributed = () => {
    const { refreshPointsNeeded, refreshPoints } = useGlobalState()
    const assessorSlotId = useGetAssessorSlotIDFromURL()
    const { data, refetch, status, error } = useGetRewardedUsers({
        assessorSlotId: assessorSlotId as string,
    })
    const [totalPoints, setTotalPoints] = useState(0)

    const sumPoints = (values: number[]) => {
        let total = 0
        values.forEach((element) => {
            total += element ? element : 0
        })
        return total
    }

    useEffect(() => {
        if (refreshPointsNeeded) {
            refetch()

            refreshPoints(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshPointsNeeded])

    useEffect(() => {
        if (data?.res)
            setTotalPoints(
                sumPoints(
                    data?.res?.map((element) => element.amount) as number[]
                )
            )
    }, [data])

    return totalPoints
}
