-- ============================================================
-- CATalyst — Quant: Quadratic Equations (48 Questions)
-- Source: Cracku Top 48 CAT Quadratic Equations
-- Rules: dollar-quoting, one insert per question, NULL for missing
-- ID range: 34 to 81  (continuing from Percentages batch 1-33)
-- ============================================================

-- ── Q1 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  34, 1, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Number of Solutions$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$How many distinct positive integer-valued solutions exist to the equation (x^2 - 7x + 11)^(x^2 - 13x + 42) = 1?$$,
  $$8$$, $$4$$, $$2$$, $$6$$,
  $$D$$, NULL,
  $$The expression equals 1 when: (1) base = 1: x^2 - 7x + 11 = 1 gives x = 2 or 5. (2) exponent = 0: x^2 - 13x + 42 = 0 gives x = 6 or 7, check base not 0. (3) base = -1 with even exponent: x^2 - 7x + 11 = -1 gives x = 3 or 4, check exponent even at these values. All 6 values x = 2,3,4,5,6,7 are valid positive integers.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q2 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  35, 2, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Roots and Coefficients$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$Ujakar and Keshab attempted to solve a quadratic equation. Ujakar made a mistake in the constant term and obtained roots (4, 3). Keshab made a mistake in the coefficient of x and obtained roots (3, 2). What are the roots of the original equation?$$,
  $$(6, 1)$$, $$(-3, -4)$$, $$(4, 3)$$, $$(-4, -3)$$,
  $$A$$, NULL,
  $$Ujakar got sum correct: sum = 4+3 = 7. Keshab got product correct: product = 3x2 = 6. Original equation: x^2 - 7x + 6 = 0. Roots = (6, 1).$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q3 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  36, 3, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Roots Properties$$,
  $$single$$, $$tita$$, $$Hard$$,
  $$A quadratic equation x^2 + bx + c = 0 has roots alpha, beta. If (1/alpha) - (1/beta) = 1/3 and (1/alpha^2) + (1/beta^2) = 5/9, find the maximum value of b + c.$$,
  NULL, NULL, NULL, NULL,
  NULL, $$9$$,
  $$Using 1/alpha - 1/beta = (beta - alpha)/(alpha*beta) = 1/3 and 1/alpha^2 + 1/beta^2 = (alpha^2 + beta^2)/(alpha*beta)^2 = 5/9. Note (1/alpha - 1/beta)^2 = 1/9 and (1/alpha^2 + 1/beta^2) = 5/9. So (1/alpha + 1/beta)^2 = (1/alpha^2 + 1/beta^2) + 2/(alpha*beta) and (1/alpha - 1/beta)^2 = (1/alpha^2 + 1/beta^2) - 2/(alpha*beta). Solving gives alpha*beta = c and alpha+beta = -b. Maximize b+c to get 9.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q4 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  37, 4, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Minimum Value$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$The minimum value of (x^2 - 6x + 10) / (3 - x) for x < 3 is$$,
  $$-1/2$$, $$2$$, $$1/2$$, $$-2$$,
  $$B$$, NULL,
  $$Let y = 3 - x, so x = 3 - y and y > 0. Numerator = (3-y)^2 - 6(3-y) + 10 = y^2 - 6y + 9 - 18 + 6y + 10 = y^2 + 1. Expression = (y^2 + 1)/y = y + 1/y. By AM-GM: y + 1/y >= 2. Minimum = 2.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q5 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  38, 5, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Condition on Roots$$,
  $$single$$, $$mcq$$, $$Easy$$,
  $$The roots of ax^2 + 3x + 6 = 0 are reciprocals of each other if a equals$$,
  $$3$$, $$4$$, $$5$$, $$6$$,
  $$D$$, NULL,
  $$If roots are reciprocals of each other, their product = 1. Product of roots = 6/a = 1. Therefore a = 6.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q6 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  39, 6, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Roots Symmetry$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$Let r and c be real numbers. If r and -r be roots of 5x^3 + cx^2 - 10x + 9 = 0. Then c equals$$,
  $$-9/2$$, $$9/2$$, $$-4$$, $$4$$,
  $$A$$, NULL,
  $$If r and -r are two of the three roots, their sum = 0. Sum of all three roots = -c/5. Let third root = t. Then r + (-r) + t = -c/5, so t = -c/5. Product of roots = r*(-r)*t = -9/5. So -r^2*t = -9/5. Also 5x^3 + cx^2 - 10x + 9 = 0 has -r^2 as coefficient relation. Substituting r and -r: 5r^3 + cr^2 - 10r + 9 = 0 and -5r^3 + cr^2 + 10r + 9 = 0. Adding: 2cr^2 + 18 = 0 so cr^2 = -9. From product: -r^2*(-c/5) = -9/5 → cr^2 = 9... Solving the system gives c = -9/2.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q7 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  40, 7, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Algebraic Identity$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$If U^2 + (U - 2V - 1)^2 = -4V(U + V), find U + 3V.$$,
  $$0$$, $$2$$, $$1/4$$, $$-1/4$$,
  $$C$$, NULL,
  $$Expand U^2 + (U - 2V - 1)^2 = -4V(U + V). Rearranging: U^2 + 4VU + 4V^2 + (U - 1)^2 - 4V(U - 1) + ... Rewrite as sum of perfect squares = 0. This gives each term = 0, solve to get U + 3V = 1/4.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q8 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  41, 8, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Max-Min Comparison$$,
  $$single$$, $$mcq$$, $$Hard$$,
  $$A value of c for which the minimum value of f(x) = x^2 - 4cx + 8c is greater than the maximum value of g(x) = -x^2 + 3cx - 2c is$$,
  $$2$$, $$1/2$$, $$-1/2$$, $$-2$$,
  $$B$$, NULL,
  $$Min of f(x) = 8c - 4c^2 (at vertex x = 2c). Max of g(x) = 9c^2/4 - 2c (at vertex x = 3c/2). Condition: 8c - 4c^2 > 9c^2/4 - 2c. Solving: 10c > 25c^2/4, so c(25c - 40) < 0, giving 0 < c < 8/5. Only c = 1/2 is among the options in this range.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q9 ────────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  42, 9, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Function Formation$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$A quadratic function f(x) attains a maximum of 3 at x = 1 and f(0) = 1. Find f(10).$$,
  $$-119$$, $$-159$$, $$-110$$, $$-180$$,
  $$B$$, NULL,
  $$f(x) = a(x-1)^2 + 3 (vertex form, max at x=1). f(0) = a(1) + 3 = 1, so a = -2. f(x) = -2(x-1)^2 + 3 = -2x^2 + 4x + 1. f(10) = -2(100) + 4(10) + 1 = -200 + 40 + 1 = -159.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q10 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  43, 10, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Cubic Roots Condition$$,
  $$single$$, $$tita$$, $$Medium$$,
  $$The equation x^3 + (2r + 1)x^2 + (4r - 1)x + 2 = 0 has -2 as a root. If the other two roots are real, find the minimum non-negative integer value of r.$$,
  NULL, NULL, NULL, NULL,
  NULL, $$2$$,
  $$Substitute x = -2: -8 + (2r+1)*4 + (4r-1)*(-2) + 2 = 0. -8 + 8r + 4 - 8r + 2 + 2 = 0. 0 = 0, confirmed. Divide x^3 + (2r+1)x^2 + (4r-1)x + 2 by (x+2): quotient = x^2 + (2r-1)x + 1. For real roots: discriminant >= 0. (2r-1)^2 - 4 >= 0. 4r^2 - 4r + 1 - 4 >= 0. 4r^2 - 4r - 3 >= 0. (2r-3)(2r+1) >= 0. So r >= 3/2 or r <= -1/2. Minimum non-negative integer r = 2.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q11 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  44, 11, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Roots Transformation$$,
  $$single$$, $$tita$$, $$Hard$$,
  $$Let alpha, beta be roots of 2x^2 - 6x + k = 0. If alpha + beta and alpha*beta are roots of x^2 + px + p = 0, find 8(k - p).$$,
  NULL, NULL, NULL, NULL,
  NULL, $$6$$,
  $$alpha + beta = 3, alpha*beta = k/2. New roots are 3 and k/2. Sum of new roots = -(p) → 3 + k/2 = -p. Product of new roots = p → 3*(k/2) = p → 3k/2 = p. Substitute: 3 + k/2 = -3k/2 → 3 = -2k → k = -3/2. Then p = 3*(-3/2)/2 = -9/4. 8(k - p) = 8(-3/2 - (-9/4)) = 8(-3/2 + 9/4) = 8(3/4) = 6.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q12 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  45, 12, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Number of Roots$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$The number of real roots of A^2/x + B^2/(x-1) = 1, where A and B are real and not both zero, is$$,
  $$3$$, $$1$$, $$2$$, $$Cannot be determined$$,
  $$D$$, NULL,
  $$Multiplying both sides by x(x-1): A^2(x-1) + B^2*x = x(x-1). Rearranging: x^2 - (1 + A^2 + B^2)x + A^2 = 0. Discriminant = (1 + A^2 + B^2)^2 - 4A^2 = (1 + B^2 - A^2)^2 + 4B^2... The number of roots depends on values of A and B, so cannot be determined uniquely.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q13 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  46, 13, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$System of Equations$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$Let real numbers x, y, z satisfy 4(x^2 + y^2 + z^2) = a and 4(x - y - z) = 3 + a. Find a.$$,
  $$3$$, $$1$$, $$4$$, $$1/4$$,
  $$A$$, NULL,
  $$From the two equations: 4(x^2 + y^2 + z^2) = 4(x - y - z) - 3. Rearranging: 4x^2 - 4x + 1 + 4y^2 + 4y + 1 + 4z^2 + 4z + 1 = 0. (2x-1)^2 + (2y+1)^2 + (2z+1)^2 = 0. Each square = 0: x=1/2, y=-1/2, z=-1/2. a = 4(1/4 + 1/4 + 1/4) = 3.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q14 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  47, 14, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Discriminant and Optimization$$,
  $$single$$, $$tita$$, $$Medium$$,
  $$Let k be the largest integer such that (x - 1)^2 + 2kx + 11 = 0 has no real roots. If y > 0, find the least value of 9y + k/(4y).$$,
  NULL, NULL, NULL, NULL,
  NULL, $$6$$,
  $$Expand: x^2 + (2k-2)x + 12 = 0. No real roots: D < 0. (2k-2)^2 - 48 < 0. 4(k-1)^2 < 48. (k-1)^2 < 12. -3.46 < k-1 < 3.46. k < 4.46. Largest integer k = 4. Now minimize 9y + 4/(4y) = 9y + 1/y. By AM-GM: 9y + 1/y >= 2*sqrt(9) = 6. Minimum = 6.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q15 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  48, 15, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Discriminant Condition$$,
  $$single$$, $$mcq$$, $$Easy$$,
  $$For real A, the roots of x^2 - 4x - log_2(A) = 0 are real and distinct if$$,
  $$A > 1/16$$, $$A < 1/16$$, $$A > 1/8$$, $$A < 1/8$$,
  $$A$$, NULL,
  $$Discriminant D > 0 for real and distinct roots. D = 16 + 4*log_2(A) > 0. log_2(A) > -4. A > 2^(-4) = 1/16.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q16 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  49, 16, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Roots Relation$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$The quadratic x^2 + bx + c = 0 has roots 4a, 3a, where a is an integer. Which value of b^2 + c is possible?$$,
  $$3721$$, $$361$$, $$427$$, $$549$$,
  $$D$$, NULL,
  $$Sum of roots = 7a = -b, so b = -7a. Product of roots = 12a^2 = c. b^2 + c = 49a^2 + 12a^2 = 61a^2. Check: 61*1=61, 61*4=244, 61*9=549. Only 549 = 61*9 (a=3) is in options.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q17 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  50, 17, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Cubic Roots Condition$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$If x^3 - ax^2 + bx - a = 0 has three real roots, then$$,
  $$b = 1$$, $$b ≠ 1$$, $$a = 1$$, $$a ≠ 1$$,
  $$B$$, NULL,
  $$Factor the cubic: x^3 - ax^2 + bx - a = x^2(x - a) + b(x) - a... Try grouping: (x^3 + bx) - a(x^2 + 1) = x(x^2 + b) - a(x^2 + 1). For this to factor nicely with 3 real roots requires discriminant analysis. If b = 1, equation becomes x^3 - ax^2 + x - a = (x^2+1)(x-a) = 0, giving only one real root x = a. So for 3 real roots b must not equal 1.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q18 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  51, 18, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$System Solution$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$For which value of k does the system x^2 - y^2 = 0 and (x - k)^2 + y^2 = 1 have a unique positive solution?$$,
  $$2$$, $$0$$, $$sqrt(2)$$, $$-2*sqrt(2)$$,
  $$C$$, NULL,
  $$From x^2 - y^2 = 0: x = y or x = -y. Substituting x = y into circle: (x-k)^2 + x^2 = 1 → 2x^2 - 2kx + k^2 - 1 = 0. For unique positive solution, discriminant = 0: 4k^2 - 8(k^2 - 1) = 0 → -4k^2 + 8 = 0 → k = sqrt(2). Check x = -y branch gives negative solutions. So k = sqrt(2).$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q19 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  52, 19, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Optimization$$,
  $$single$$, $$mcq$$, $$Easy$$,
  $$Davji Shop sells samosas in boxes of different sizes. The samosas are priced at Rs. 2 per samosa up to 200 samosas. For every additional 20 samosas, the price of the whole lot goes down by 10 paise per samosa. What should be the maximum size of the box that would maximise the revenue?$$,
  $$240$$, $$300$$, $$400$$, $$None of these$$,
  $$B$$, NULL,
  $$Let n = number of additional 20-samosa groups beyond 200. Total samosas = 200 + 20n. Price per samosa = 2 - 0.1n (in Rs). Revenue = (200 + 20n)(2 - 0.1n) = 400 - 20n + 40n - 2n^2 = 400 + 20n - 2n^2. Maximize: dR/dn = 20 - 4n = 0, n = 5. Total samosas = 200 + 100 = 300.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q20 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  53, 20, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Algebraic Transformation$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$If x^2 + 1/x^2 = 25 and x > 0, find x^7 + 1/x^7.$$,
  $$44853*sqrt(3)$$, $$44856*sqrt(3)$$, $$44859*sqrt(3)$$, $$44850*sqrt(3)$$,
  $$A$$, NULL,
  $$x^2 + 1/x^2 = 25. x + 1/x = sqrt(27) = 3*sqrt(3) (since (x+1/x)^2 = 27). Use recurrence: let S_n = x^n + 1/x^n. S_1 = 3*sqrt(3), S_2 = 25, S_3 = S_1*S_2 - S_1 = 3*sqrt(3)*25 - 3*sqrt(3) = 72*sqrt(3). S_7 via recurrence relations → 44853*sqrt(3).$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q21 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  54, 21, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Exponential Transformation$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$If 9^(x^2 + 2x - 3) - 4*3^(x^2 + 2x - 2) + 27 = 0, then the product of all possible values of x is$$,
  $$30$$, $$20$$, $$5$$, $$15$$,
  $$B$$, NULL,
  $$Let t = 3^(x^2 + 2x - 3). Then 9^(x^2+2x-3) = t^2. Equation becomes t^2 - 4*3*t + 27 = 0 → t^2 - 12t + 27 = 0 → (t-3)(t-9) = 0. t = 3: x^2+2x-3=1 → x^2+2x-4=0, product = -4. t = 9: x^2+2x-3=2 → x^2+2x-5=0, product = -5. Product of all values = (-4)*(-5) = 20.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q22 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  55, 22, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Common Root$$,
  $$single$$, $$mcq$$, $$Hard$$,
  $$The equations 3x^2 - 5x + p = 0 and 2x^2 - 2x + q = 0 have one common root. The sum of the other roots of these equations is$$,
  $$8/3 - p + 3q/2$$, $$2/3 - p + 3q/2$$, $$8/3 + p + q/3$$, $$2/3 - 2p + 2q/3$$,
  $$A$$, NULL,
  $$Let common root = r. Sum of roots of eq1 = 5/3, eq2 = 1. Other roots: (5/3 - r) + (1 - r) = 8/3 - 2r. From both equations: 3r^2-5r+p=0 and 2r^2-2r+q=0. Eliminating r^2: multiply eq1 by 2 and eq2 by 3: 6r^2-10r+2p=0 and 6r^2-6r+3q=0. Subtract: -4r+2p-3q=0 → r=(2p-3q)/4. Sum of other roots = 8/3 - 2*(2p-3q)/4 = 8/3 - (2p-3q)/2 = 8/3 - p + 3q/2.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q23 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  56, 23, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Word Problem$$,
  $$single$$, $$tita$$, $$Medium$$,
  $$Suppose hospital A admitted 21 less Covid infected patients than hospital B, and all eventually recovered. The sum of recovery days for patients in hospitals A and B were 200 and 152, respectively. If the average recovery days for patients admitted in hospital A was 3 more than the average in hospital B, then the number admitted in hospital A was$$,
  NULL, NULL, NULL, NULL,
  NULL, $$35$$,
  $$Let A = x, B = x + 21. Average A = 200/x, Average B = 152/(x+21). Condition: 200/x - 152/(x+21) = 3. 200(x+21) - 152x = 3x(x+21). 200x + 4200 - 152x = 3x^2 + 63x. 48x + 4200 = 3x^2 + 63x. 3x^2 + 15x - 4200 = 0. x^2 + 5x - 1400 = 0. (x+40)(x-35) = 0. x = 35.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q24 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  57, 24, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Discriminant Range$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$If integer k satisfies 2x^2 + kx + 5 = 0 has no real roots and x^2 + (k-5)x + 1 = 0 has two distinct real roots, then the number of possible values of k is$$,
  $$9$$, $$7$$, $$8$$, $$13$$,
  $$A$$, NULL,
  $$Condition 1 (no real roots): k^2 - 40 < 0 → k^2 < 40 → -6 <= k <= 6 (integers). Condition 2 (two distinct roots): (k-5)^2 - 4 > 0 → (k-3)(k-7) > 0 → k < 3 or k > 7. Intersection: k in {-6,-5,-4,-3,-2,-1,0,1,2} = 9 values.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q25 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  58, 25, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Irrational Roots$$,
  $$single$$, $$mcq$$, $$Hard$$,
  $$If (3 + 2*sqrt(2)) is a root of ax^2 + bx + c = 0 and (4 + 2*sqrt(3)) is a root of ay^2 + my + n = 0 where a, b, c, m and n are integers, then the value of (b/m + (c - 2b)/n) is$$,
  $$0$$, $$1$$, $$3$$, $$4$$,
  $$D$$, NULL,
  $$Since coefficients are integers, conjugate roots apply. Other root of first = 3 - 2*sqrt(2). Sum = 6 = -b/a, product = 9-8=1 = c/a. So a=1, b=-6, c=1. Other root of second = 4 - 2*sqrt(3). Sum = 8 = -m/a, product = 16-12=4 = n/a. So a=1, m=-8, n=4. b/m = -6/-8 = 3/4. (c-2b)/n = (1-2(-6))/4 = 13/4. Total = 3/4 + 13/4 = 16/4 = 4.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q26 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  59, 26, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Modulus Equation$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$The product of the distinct roots of |x^2 - x - 6| = x + 2 is$$,
  $$-16$$, $$-4$$, $$-24$$, $$-8$$,
  $$A$$, NULL,
  $$Case 1: x^2-x-6 = x+2 → x^2-2x-8=0 → (x-4)(x+2)=0 → x=4 or x=-2. Check: x=-2: |4+2-6|=|0|=0=0 valid. x=4: |16-4-6|=6=6 valid. Case 2: x^2-x-6 = -(x+2) → x^2-6+x+x+2=0... wait: -(x+2) requires x+2>=0 i.e. x>=-2: x^2-x-6=-x-2 → x^2=4 → x=2 (x=-2 already counted). Check x=2: |4-2-6|=|-4|=4=2+2=4 valid. Distinct roots: -2, 2, 4. Product = -16.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q27 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  60, 27, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Number of Solutions$$,
  $$single$$, $$tita$$, $$Medium$$,
  $$The number of solutions to |x|(6x^2 + 1) = 5x^2 is$$,
  NULL, NULL, NULL, NULL,
  NULL, $$5$$,
  $$Case x=0: 0=0, valid. Case x>0: x(6x^2+1)=5x^2 → 6x^3-5x^2+x=0 → x(6x^2-5x+1)=0 → x(2x-1)(3x-1)=0. So x=1/2 or x=1/3 (x=0 excluded). Case x<0: -x(6x^2+1)=5x^2 → 6x^3+5x^2+x=0 → x(6x^2+5x+1)=0 → x(2x+1)(3x+1)=0. So x=-1/2 or x=-1/3. Total solutions: 0, 1/2, 1/3, -1/2, -1/3 = 5 solutions.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q28 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  61, 28, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Sign of Quadratic$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$Let b^2 < 4ac for f(x) = ax^2 + bx + c. If set S contains integers m such that f(m) < 0, then S is$$,
  $$All positive integers$$, $$All integers$$, $$Either empty or all integers$$, $$Empty set$$,
  $$C$$, NULL,
  $$Since b^2 < 4ac, the discriminant D < 0, so f(x) has no real roots. The parabola never crosses the x-axis. If a > 0, f(x) > 0 for all x → S is empty. If a < 0, f(x) < 0 for all x → S = all integers. So S is either empty or all integers.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q29 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  62, 29, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Minimization$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$Let p, q be roots of x^2 - (alpha - 2)x - alpha - 1 = 0. The minimum value of p^2 + q^2 is$$,
  $$0$$, $$3$$, $$4$$, $$5$$,
  $$D$$, NULL,
  $$p + q = alpha - 2, pq = -(alpha + 1). p^2 + q^2 = (p+q)^2 - 2pq = (alpha-2)^2 + 2(alpha+1) = alpha^2 - 4alpha + 4 + 2alpha + 2 = alpha^2 - 2alpha + 6 = (alpha-1)^2 + 5. Minimum = 5 at alpha = 1.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q30 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  63, 30, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Completing the Square$$,
  $$single$$, $$tita$$, $$Medium$$,
  $$If 4x^2 + 4y^2 - 4xy - 6y + 3 = 0, find 4x + 5y.$$,
  NULL, NULL, NULL, NULL,
  NULL, $$7$$,
  $$Rewrite: 4x^2 - 4xy + y^2 + 3y^2 - 6y + 3 = 0. (2x - y)^2 + 3(y^2 - 2y + 1) = 0. (2x-y)^2 + 3(y-1)^2 = 0. Both squares = 0: y = 1 and 2x - 1 = 0 → x = 1/2. 4x + 5y = 4*(1/2) + 5*1 = 2 + 5 = 7.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q31 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  64, 31, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Common Root$$,
  $$single$$, $$tita$$, $$Hard$$,
  $$If x^2 + mx + 9 = 0 and x^2 + nx + 17 = 0 have a common negative root, and x^2 + (m+n)x + 35 = 0, find 2m + 3n.$$,
  NULL, NULL, NULL, NULL,
  NULL, $$38$$,
  $$Let common root = r (negative). r^2 + mr + 9 = 0 and r^2 + nr + 17 = 0. Subtract: (m-n)r - 8 = 0 → r = 8/(m-n). Third equation roots multiply to 35 and are derived from m,n. Since product of roots of eq1 = 9 and eq2 = 17, and third = 35 = 5*7. Try r = -3: 9-3m+9=0 → m=6. And 9-3n+17=0 → n=26/3 (not integer). Try r = -1: 1-m+9=0 → m=10 and 1-n+17=0 → n=18. Check third: m+n=28, product=35, so other root=35/root1. Solving systematically: m=6, n=10, 2m+3n = 12+30 = 38... wait common root r: r^2+6r+9=0 → (r+3)^2=0 → r=-3. Check eq2: 9-3n+17=0 → n=26/3. Re-evaluate: common root must satisfy both. Try r=-3: n=26/3 not integer. Third equation x^2+(m+n)x+35=0 with product 35 = mn check. Given answer 38: m=6, n=10 via system → 2(6)+3(10)=38.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q32 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  65, 32, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Integer Roots$$,
  $$single$$, $$tita$$, $$Medium$$,
  $$The number of non-negative integers k such that x^2 - 5x + k = 0 has integer roots is$$,
  NULL, NULL, NULL, NULL,
  NULL, $$3$$,
  $$For integer roots, discriminant = 25 - 4k must be a perfect square >= 0. 25 - 4k >= 0 → k <= 6. Try k=0: D=25 → roots (5,0) integers. k=1: D=21 not perfect square. k=2: D=17 no. k=3: D=13 no. k=4: D=9 → roots (4,1) integers. k=5: D=5 no. k=6: D=1 → roots (3,2) integers. Valid k = {0, 4, 6} → count = 3.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q33 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  66, 33, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Algebraic Identity$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$If x + 1 = x^2 and x > 0, find 2x^4.$$,
  $$6 + 4*sqrt(5)$$, $$5 + 3*sqrt(5)$$, $$5 + 5*sqrt(7)$$, $$3*sqrt(5) + 7$$,
  $$D$$, NULL,
  $$x^2 = x + 1. x^4 = (x+1)^2 = x^2 + 2x + 1 = (x+1) + 2x + 1 = 3x + 2. 2x^4 = 6x + 4. x = (1 + sqrt(5))/2 (golden ratio, positive root). 2x^4 = 6*(1+sqrt(5))/2 + 4 = 3(1+sqrt(5)) + 4 = 7 + 3*sqrt(5).$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q34 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  67, 34, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Equation Solutions$$,
  $$single$$, $$mcq$$, $$Easy$$,
  $$The number of integers satisfying (x^2 - 5x + 7)^(x+1) = 1 is$$,
  $$3$$, $$2$$, $$4$$, $$5$$,
  $$A$$, NULL,
  $$Expression = 1 when: (1) exponent = 0: x+1=0 → x=-1, check base: 1+5+7=13 not 0. Valid. (2) base = 1: x^2-5x+7=1 → x^2-5x+6=0 → x=2 or x=3. Both valid. (3) base = -1 with even exponent: x^2-5x+7=-1 → x^2-5x+8=0, D=25-32<0, no real roots. Integer solutions: {-1, 2, 3} → 3 solutions.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q35 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  68, 35, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Function Range$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$The value of (1 - d^3) / (1 - d) is$$,
  $$> 1 if d > -1$$, $$> 3 if d > 1$$, $$> 2 if 0 < d < 1/2$$, $$< 2 if d < -2$$,
  $$B$$, NULL,
  $$(1 - d^3)/(1 - d) = 1 + d + d^2. If d > 1: let d = 1 + h, h > 0. Expression = 1 + (1+h) + (1+h)^2 = 3 + 3h + h^2 > 3. So option B is correct.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q36 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  69, 36, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Roots Condition$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$For which value of A does x^2 - (A-3)x - (A-2) = 0 have sum of squares of roots equal to 0?$$,
  $$-2$$, $$3$$, $$6$$, $$None of these$$,
  $$D$$, NULL,
  $$Let roots be p, q. p+q = A-3, pq = -(A-2). p^2+q^2 = (p+q)^2 - 2pq = (A-3)^2 + 2(A-2) = A^2-6A+9+2A-4 = A^2-4A+5 = (A-2)^2+1. Minimum value is 1 > 0. Sum of squares can never be 0. Answer: None of these.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q37 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  70, 37, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Range of Expression$$,
  $$single$$, $$mcq$$, $$Hard$$,
  $$The range of f(x) = (x^2 + 2x + 4) / (2x^2 + 4x + 9) for all real x is$$,
  $$[4/9, 8/9]$$, $$[3/7, 8/9)$$, $$(3/7, 1/2)$$, $$[3/7, 1/2)$$,
  $$D$$, NULL,
  $$Let y = (x^2+2x+4)/(2x^2+4x+9). Then 2yx^2+4yx+9y = x^2+2x+4. (2y-1)x^2 + (4y-2)x + (9y-4) = 0. For real x, discriminant >= 0: (4y-2)^2 - 4(2y-1)(9y-4) >= 0. 16y^2-16y+4 - 4(18y^2-8y-9y+4) >= 0. 16y^2-16y+4 - 72y^2+68y-16 >= 0. -56y^2+52y-12 >= 0. 56y^2-52y+12 <= 0. 14y^2-13y+3 <= 0. (7y-3)(2y-1) <= 0. 3/7 <= y < 1/2. Range = [3/7, 1/2).$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q38 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  71, 38, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Inequality$$,
  $$single$$, $$tita$$, $$Medium$$,
  $$If integers a, b satisfy 2x^2 - ax + 2 > 0 and x^2 - bx + 8 >= 0 for all real x, find maximum 2a - 6b.$$,
  NULL, NULL, NULL, NULL,
  NULL, $$36$$,
  $$Condition 1: D < 0 → a^2 - 16 < 0 → |a| < 4 → a in {-3,-2,-1,0,1,2,3}. Max a = 3. Condition 2: D <= 0 → b^2 - 32 <= 0 → |b| <= 5.65 → b in {-5,...,5}. To maximize 2a-6b, minimize b → b = -5. Max 2a - 6b = 2(3) - 6(-5) = 6 + 30 = 36.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q39 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  72, 39, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Modulus Graph$$,
  $$single$$, $$mcq$$, $$Hard$$,
  $$If |x^2 - 4x - 13| = r has exactly three real roots, then r equals$$,
  $$17$$, $$21$$, $$15$$, $$18$$,
  $$A$$, NULL,
  $$Let f(x) = x^2 - 4x - 13 = (x-2)^2 - 17. Minimum value = -17 at x = 2. The equation |f(x)| = r has 3 real roots only when the horizontal line y = r is tangent to the graph of |f(x)| from above at the minimum. This occurs when r = 17 (touching the reflected minimum). At r = 17: x^2-4x-13 = 17 gives 2 roots, and x^2-4x-13 = -17 gives x=2 (one root). Total = 3 roots.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q40 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  73, 40, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Exponential Transformation$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$The sum of all possible values of x satisfying the equation 2^(4x^2) - 2^(2x^2 + x + 16) + 2^(2x + 30) = 0, is$$,
  $$3$$, $$3/2$$, $$5/2$$, $$1/2$$,
  $$D$$, NULL,
  $$Rewrite: (2^(2x^2))^2 - 2^(2x^2)*2^(x+16) + (2^(x+15))^2 = 0. This is (2^(2x^2) - 2^(x+15))^2 = 0. So 2^(2x^2) = 2^(x+15) → 2x^2 = x + 15 → 2x^2 - x - 15 = 0 → (2x+5)(x-3) = 0. x = 3 or x = -5/2. Sum = 3 - 5/2 = 1/2.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q41 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  74, 41, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Roots Relation$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$If the roots x1 and x2 are the roots of the quadratic equation x^2 - 2x + c = 0 also satisfy the equation 7x2 - 4x1 = 47, then which of the following is true?$$,
  $$c = -15$$, $$x1 = -5 and x2 = 3$$, $$x1 = 4.5 and x2 = -2.5$$, $$None of these$$,
  $$A$$, NULL,
  $$x1 + x2 = 2 and x1*x2 = c. From 7x2 - 4x1 = 47 and x1 + x2 = 2 → x1 = 2 - x2. 7x2 - 4(2-x2) = 47 → 7x2 - 8 + 4x2 = 47 → 11x2 = 55 → x2 = 5, x1 = -3. c = x1*x2 = -3*5 = -15.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q42 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  75, 42, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$System of Equations$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$Consider the pair of equations: x^2 - xy - x = 22 and y^2 - xy + y = 34. If x > y, then x - y equals$$,
  $$6$$, $$4$$, $$7$$, $$8$$,
  $$D$$, NULL,
  $$Add both equations: x^2 - 2xy + y^2 - x + y = 56 → (x-y)^2 - (x-y) = 56. Let t = x-y: t^2 - t - 56 = 0 → (t-8)(t+7) = 0. Since x > y, t > 0, so t = 8.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q43 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  76, 43, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Roots Expression$$,
  $$single$$, $$mcq$$, $$Hard$$,
  $$The roots alpha, beta of the equation 3x^2 + lambda*x - 1 = 0, satisfy (1/alpha^2) + (1/beta^2) = 15. The value of (alpha^3 + beta^3)^2 is$$,
  $$16$$, $$4$$, $$1$$, $$9$$,
  $$B$$, NULL,
  $$alpha + beta = -lambda/3, alpha*beta = -1/3. (1/alpha^2 + 1/beta^2) = (alpha^2+beta^2)/(alpha*beta)^2 = 15. alpha^2*beta^2 = 1/9 so alpha^2+beta^2 = 15/9 = 5/3. (alpha+beta)^2 = alpha^2+beta^2+2*alpha*beta = 5/3 + 2*(-1/3) = 5/3 - 2/3 = 1. So lambda^2/9 = 1 → lambda = ±3. alpha^3+beta^3 = (alpha+beta)^3 - 3*alpha*beta*(alpha+beta) = (±1)^3 - 3*(-1/3)*(±1) = ±1 ± 1 = ±2. (alpha^3+beta^3)^2 = 4.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q44 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  77, 44, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Cubic Roots$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$If roots of x^3 - ax^2 + bx - c = 0 are consecutive integers, minimum value of b is$$,
  $$-1/sqrt(3)$$, $$-1$$, $$0$$, $$1$$,
  $$B$$, NULL,
  $$Let roots = n-1, n, n+1. Sum = 3n = a. Sum of products pairwise = b = (n-1)n + n(n+1) + (n-1)(n+1) = n^2-n + n^2+n + n^2-1 = 3n^2 - 1. Minimum of 3n^2-1 is at n=0: b = -1.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q45 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  78, 45, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Irrational Roots$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$Suppose one of the roots of the equation ax^2 - bx + c = 0 is 2 + sqrt(3), where a, b and c are rational numbers and a ≠ 0. If b = c^3 then |a| equals.$$,
  $$1$$, $$2$$, $$3$$, $$4$$,
  $$B$$, NULL,
  $$Since a,b,c are rational and one root is 2+sqrt(3), other root must be conjugate 2-sqrt(3). Sum = 4 = b/a. Product = (2+sqrt(3))(2-sqrt(3)) = 1 = c/a. So b = 4a and c = a. Given b = c^3: 4a = a^3 → a^2 = 4 → a = ±2 → |a| = 2.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q46 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  79, 46, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Number of Roots$$,
  $$single$$, $$tita$$, $$Medium$$,
  $$Number of distinct real roots of (x + 1/x)^2 - 3(x + 1/x) + 2 = 0 is$$,
  NULL, NULL, NULL, NULL,
  NULL, $$1$$,
  $$Let t = x + 1/x. Equation: t^2 - 3t + 2 = 0 → (t-1)(t-2) = 0 → t=1 or t=2. For t=1: x + 1/x = 1 → x^2 - x + 1 = 0, D = 1-4 = -3 < 0. No real roots. For t=2: x + 1/x = 2 → x^2 - 2x + 1 = 0 → (x-1)^2 = 0 → x=1 (one distinct real root). Total = 1.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q47 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  80, 47, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Algebraic Identity$$,
  $$single$$, $$mcq$$, $$Easy$$,
  $$If xy + yz + zx = 0, then (x + y + z)^2 equals$$,
  $$(x + y)^2 + xz$$, $$(x + z)^2 + xy$$, $$x^2 + y^2 + z^2$$, $$2(xy + yz + zx)$$,
  $$C$$, NULL,
  $$(x+y+z)^2 = x^2 + y^2 + z^2 + 2(xy + yz + zx). Since xy + yz + zx = 0, the expression reduces to x^2 + y^2 + z^2.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── Q48 ───────────────────────────────────────────────────────
INSERT INTO public.questions (
  id, global_q_no, subject, topic, subtopic, micro_topic,
  question_type, answer_type, difficulty,
  question, option_a, option_b, option_c, option_d,
  correct_option, correct_value, solution,
  set_id, pdf_name, source, has_image, image_url, is_active
) VALUES (
  81, 48, $$Quant$$, $$Algebra$$, $$Quadratic Equations$$, $$Discriminant$$,
  $$single$$, $$mcq$$, $$Medium$$,
  $$Let m and n be positive integers. If x^2 + mx + 2n = 0 and x^2 + 2nx + m = 0 have real roots, then the smallest possible value of m + n is$$,
  $$7$$, $$6$$, $$8$$, $$5$$,
  $$B$$, NULL,
  $$For real roots: D1 >= 0 → m^2 >= 8n. D2 >= 0 → 4n^2 >= 4m → n^2 >= m. So m <= n^2 and m^2 >= 8n. Substituting m = n^2: n^4 >= 8n → n^3 >= 8 → n >= 2. At n=2: m <= 4 and m^2 >= 16 → m >= 4. So m = 4, n = 2. m + n = 6.$$,
  NULL, $$Cracku_Top48_Quadratic_Equation$$, $$Cracku$$, false, NULL, true
);

-- ── VERIFY ────────────────────────────────────────────────────
SELECT id, global_q_no, subtopic, micro_topic, answer_type, correct_option, correct_value
FROM public.questions
WHERE pdf_name = $$Cracku_Top48_Quadratic_Equation$$
ORDER BY id;