// 13. NEW ANNOUNCEMENT

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard } from '../_components/EmailLayout.ts'

interface AnnouncementData {
  userName: string
  announcementTitle: string
  announcementSummary: string
  publishedAt: string
  announcementUrl: string
  collegeName: string
}

export function renderAnnouncement(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AnnouncementData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph(`A new announcement has been published by <strong>${data.collegeName}</strong>.`)}
    ${renderDivider()}
    ${renderInfoCard('Announcement', [
      { label: 'Title', value: data.announcementTitle },
      { label: 'Published', value: data.publishedAt },
    ])}
    ${renderParagraph(data.announcementSummary)}
    ${renderButton(data.announcementUrl, 'Read Announcement')}
  `

  return createEmailLayout(config, content, `New announcement from ${data.collegeName}`)
}