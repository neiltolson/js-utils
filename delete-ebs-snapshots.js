#!/usr/bin/env node
'use strict'

/**
 * Retrieve all snapshots in the current aws account/region.
 * Filter to non-ami snapshots within 30 days and delete them.
 *
 * Uses AWS-SDK v2 and dayjs
 */
const AWS = require('aws-sdk')
const dayjs = require('dayjs')

async function main () {
  const iam = new AWS.IAM()
  const accountAliases = await iam.listAccountAliases().promise()
  console.log('Running against Account: %j', accountAliases.AccountAliases)

  const ec2 = new AWS.EC2({apiVersion: '2016-11-15'})
  const snapshots = await ec2.describeSnapshots({ OwnerIds: ['self'] }).promise()
  console.log('Found %j snapshots', snapshots.Snapshots.length)

  const deleteBefore = dayjs().subtract(30, 'day').toISOString()
  const deleteSnaps = snapshots.Snapshots
    .filter((s) => (s.StartTime.toISOString() < deleteBefore))
    .filter((s) => !s.Description.includes("ami-"))
    .sort((a, b) => a.StartTime.getTime() - b.StartTime.getTime())


  console.log('Found %j snapshots older than %j and not for AMIs', deleteSnaps.length, deleteBefore)

  let count = 0
  for (const snap of deleteSnaps) {
    count ++;
    console.log('(%d) Deleting %s from %s with description "%s"', count, snap.SnapshotId, snap.StartTime.toISOString(), snap.Description)
    try {
      await ec2.deleteSnapshot({SnapshotId: snap.SnapshotId, DryRun: true}).promise()
    } catch (error) {
      console.error('Error deleting snapshot %j: ', snap, error)
      if (error.code === 'InvalidSnapshot.InUse') {
        console.log('Snapshot %s is in use: %s', snap.SnapshotId, error.message)
      }
      else {
        throw error
      }
    }

  }
}

main().catch((err) => {
  console.log(err)
  process.exit(1)
})