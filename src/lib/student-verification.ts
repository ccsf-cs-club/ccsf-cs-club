export function verifyCCSFStudent(email: string, hostedDomain?: string): boolean {
  // Check if email is from CCSF domain
  const isValidDomain = email.endsWith('@mail.ccsf.edu') || 
                       email.endsWith('@ccsf.edu') ||
                       (hostedDomain === 'mail.ccsf.edu');
  
  // Additional verification for student ID format
  const emailPrefix = email.split('@')[0];
  const studentIdPattern = /^[a-z]\d{7}$/; // CCSF student ID format
  
  return isValidDomain && studentIdPattern.test(emailPrefix);
}

export function extractStudentId(email: string): string | null {
  const prefix = email.split('@')[0];
  return /^[a-z]\d{7}$/.test(prefix) ? prefix : null;
}

export async function verifyGitHubEducation(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const user = await response.json();
    
    // Check for GitHub Education status
    return user.type === 'User' && user.plan?.name === 'free'; // Student accounts are typically free
  } catch (error) {
    return false;
  }
}