import { useUserStore } from 'stores/user-store';
import { useExamStore } from 'stores/exam-store';
import { usePaperStore } from 'stores/paper-store';
import { useRouterInstance } from 'src/router'
import { accessWithToken } from 'src/util/util-net';
import { url_exam_behavior, url_exam_section_submit } from 'src/util/util-url';

const userStore = useUserStore();
const examStore = useExamStore();
const paperStore = usePaperStore();
const router = useRouterInstance();


export const logout = () => {
  userStore.logout();
  examStore.clearExam();
  paperStore.clearPaper();
  router.push('/').catch(err => console.error('Navigation error:', err));
}

export const behavior = (behavior_type: string) => {
  if (!userStore.token) {
    return;
  }
  accessWithToken({
    method: 'POST',
    token: userStore.token,
    url: url_exam_behavior,
  }, {
    behavior_type: behavior_type,
  });
}

const onSubmitSectionSuccess = function() {
  examStore.section = null;
  router.push('/exam').catch(err => console.error('Fail to go to exam:', err));
}

export const clearCountDownTimer = () => {
  if (examStore.timer_count_down) {
    clearInterval(examStore.timer_count_down);
    examStore.timer_count_down = null;
  }
}

export const submitSection = () => {
  clearCountDownTimer();
  accessWithToken({
    method: 'POST',
    onSuccess: onSubmitSectionSuccess,
    token: userStore.token,
    url: url_exam_section_submit,
  }, {
    exam_id: examStore.exam.id,
    section_id: examStore.section.id,
    last_section: examStore.section.seq == paperStore.sections.length,
  });
}
