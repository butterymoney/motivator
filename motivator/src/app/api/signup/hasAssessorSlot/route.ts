import { and, eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot } from '@db/schema'
import { NextRequest } from 'next/server'
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function GET(request: NextRequest) {
    const body = await request.json()

    const assessorAddr = body.assessorAddr

    const hasAssessorSlot = await db.query.assessor_slot.findFirst({
        where: and(
            eq(assessor_slot.assessor_ID, assessorAddr),
            eq(assessor_slot.done, false)
        ),
    })

    if (!hasAssessorSlot) {
        return Response.json({
            status: 'ok',
            message: 'AssessorSlot not assigned to this assessor',
        })
    }

    return Response.json({
        status: 'ok',
        message: 'Assessor already have an Assessor Slot assigned',
    })
}
