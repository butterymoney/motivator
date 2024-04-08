'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot } from '@db/schema'
/** Assign an Assessor Slot to an Assessor
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function randomizeAssessorSlot({
    assessorAddr,
}: {
    assessorAddr: string
}) {
    /**
     * Get Number Actions and Total Volume for each Users
     * Use ponderation to get the total score of each user
     * create pools of users with range of score
     * use frequencies number assignated to each pools
     * multiply the sum of all frequencies by the number of user and divide by 10 (the number of users by assessor slots)
     * then use frequencies to fill the assessor slots with user regarding each frequency
     * then define a composition of assessor slot model like 4 pool A 3 pool B 2 pool C 1 pool D
     * then for each assessor slot use the pool composition to assign users to the assessor slot
     * we will store the pool in an array and then parse the pool. When the pool will be parsed we will shuffle the pool to avoid same combination of users
     *
     */
    // * Get Number Actions and Total Volume for each Users
    const numberAndActionsFromUsers = await db.query.stats.findMany()

    // * Use ponderation to get the total score of each user
    const ratioVolume = 1.5
    const ratioActions = 3

    const totalMultiplier = Number(process.env.TOTAL_MULTIPLIER)

    type ScoreAndAddress = {
        score: number
        address: string
    }
    let sumOfScore = 0
    // * Assign Ponderation score to users and store them in an array
    const getScoreAndAddresseses: () => ScoreAndAddress[] = () => {
        const result: ScoreAndAddress[] = []
        numberAndActionsFromUsers.forEach((element) => {
            result.push({
                score:
                    (element?.actions ? element?.actions : 0 * ratioActions) +
                    (element?.volume ? element.volume : 0 * ratioVolume),
                address: element.user_address,
            })

            sumOfScore += result[result.length - 1].score
        })
        // * Normalize the score
        result.forEach((element) => {
            element.score = (element.score / sumOfScore) * totalMultiplier
        })
        return result
    }
    const generalPool: ScoreAndAddress[] = []
    // append the pool to general pool foreach frequency
    const cumulativeList = (list: ScoreAndAddress[]) => {
        list.forEach((element) => {
            for (let index = 0; index < element.score; index++) {
                generalPool.push(element)
            }
        })
    }

    // Pick X users randomly from the pool and ensure that the same user is not picked twice
    const pickXUsersRandomly = (pool: ScoreAndAddress[], x: number) => {
        const result: ScoreAndAddress[] = []
        for (let index = 0; index < x; index++) {
            const randomIndex = Math.floor(Math.random() * pool.length)
            // * Check if the user is already in the result, if yes pick another one
            if (
                result.find(
                    (element) => element.address === pool[randomIndex].address
                )
            ) {
                pool.splice(randomIndex, 1)
                index--
                continue
            }
            result.push(pool[randomIndex])
            pool.splice(randomIndex, 1)
        }
        return result
    }

    const randomizeAssessorSlot = async () => {
        // * Get the number of assessor slot
        const scoreAndAddresseses = getScoreAndAddresseses()
        cumulativeList(scoreAndAddresseses)
        return pickXUsersRandomly(generalPool, 10)
    }

    return await randomizeAssessorSlot()
}
